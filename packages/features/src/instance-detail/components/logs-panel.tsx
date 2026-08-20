import type { JanusApiClient } from "@janus/api-client/client"
import { cn } from "@janus/ui/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual"
import { ChevronsDownUp, ChevronsUpDown, Pause, Play, RefreshCw, Search } from "lucide-react"
import { animate, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { logsQueryOptions } from "../../api/queries"
import {
  findLogMatches,
  type LogBlock,
  type LogSection,
  type LogSourceLine,
  mergeBoundedLogEntryTail,
  normalizeLogSearch,
  type ParsedLogLine,
  parseLogSections,
  reconcileLogBlockExpansion,
} from "../instance-detail-utils"
import { LogViewportSkeleton } from "./instance-detail-skeletons"
import { LogBlockHeader, LogLine, LogSectionHeader } from "./instance-log-view"
import { PageHeading } from "./instance-panel-primitives"

const LOG_SESSION_LINE_LIMIT = 500
const LOG_VIRTUAL_OVERSCAN = 12

type LogVirtualRow =
  | { expanded: boolean; key: string; kind: "section"; section: LogSection }
  | { block: LogBlock; expanded: boolean; key: string; kind: "block"; nested: boolean }
  | {
      blockId: string
      key: string
      kind: "line"
      line: ParsedLogLine
      nested: boolean
    }

function buildLogVirtualRows(
  sections: readonly LogSection[],
  expandedSectionsById: Readonly<Record<string, boolean>>,
  expandedByBlockId: Readonly<Record<string, boolean>>,
): LogVirtualRow[] {
  const rows: LogVirtualRow[] = []

  for (const [sectionIndex, section] of sections.entries()) {
    const sectionExpanded =
      !section.explicit ||
      (expandedSectionsById[section.id] ?? sectionIndex === sections.length - 1)
    if (section.explicit) {
      rows.push({
        expanded: sectionExpanded,
        key: `section:${section.id}`,
        kind: "section",
        section,
      })
    }
    if (!sectionExpanded) {
      continue
    }

    for (const [blockIndex, block] of section.blocks.entries()) {
      const blockExpanded = expandedByBlockId[block.id] ?? blockIndex === section.blocks.length - 1
      rows.push({
        block,
        expanded: blockExpanded,
        key: `block:${block.id}`,
        kind: "block",
        nested: section.explicit,
      })
      if (!blockExpanded) {
        continue
      }
      for (const line of block.lines) {
        rows.push({
          blockId: block.id,
          key: `line:${line.id}`,
          kind: "line",
          line,
          nested: section.explicit,
        })
      }
    }
  }

  return rows
}

function estimateLogRowSize(row: LogVirtualRow | undefined) {
  if (!row) {
    return 24
  }
  if (row.kind === "section") {
    return 44
  }
  if (row.kind === "block") {
    return row.block.hierarchyLevel === 2 ? 40 : 48
  }
  return row.line.kind === "substage" ? 28 : 22
}

export function LogsPanel({ api, instance }: { api: JanusApiClient; instance: string }) {
  const [paused, setPaused] = useState(false)
  const [following, setFollowing] = useState(true)
  const [search, setSearch] = useState("")
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({})
  const [expandedSectionsById, setExpandedSectionsById] = useState<Record<string, boolean>>({})
  const [sessionLines, setSessionLines] = useState<LogSourceLine[]>([])
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollAnimationRef = useRef<{ stop: () => void } | null>(null)
  const programmaticScrollRef = useRef(false)
  const userScrollIntentRef = useRef(false)
  const userScrollIntentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const followSuppressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resumeFollowingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressFollowFromLayoutRef = useRef(false)
  const hasInitialScrollRef = useRef(false)
  const reduceMotion = useReducedMotion()
  const logs = useQuery({
    ...logsQueryOptions(api, instance, 200),
    refetchInterval: paused ? false : 2_000,
  })
  const latestTail = useMemo<LogSourceLine[] | undefined>(() => {
    if (!logs.data) {
      return undefined
    }
    if (logs.data.entries) {
      return logs.data.entries
    }
    return logs.data.lines.map((content) => ({ content, timestampMs: null }))
  }, [logs.data])
  const rawLines = sessionLines
  const sections = useMemo(() => parseLogSections(rawLines), [rawLines])
  const blocks = useMemo(() => sections.flatMap((section) => section.blocks), [sections])
  const matches = useMemo(() => findLogMatches(blocks, search), [blocks, search])
  const searchActive = normalizeLogSearch(search).length > 0
  const normalizedMatchIndex = matches.length > 0 ? currentMatchIndex % matches.length : 0
  const currentMatch = matches[normalizedMatchIndex] ?? null
  const currentBlockId = currentMatch?.blockId ?? null
  const currentLineId = currentMatch?.lineId ?? null
  const currentSectionId =
    sections.find((section) => section.blocks.some((block) => block.id === currentBlockId))?.id ??
    null
  const lastRawLine = rawLines.at(-1)
  const allCollapsed =
    blocks.length > 0 &&
    blocks.every((block) => expandedById[block.id] === false) &&
    sections.every((section) => !section.explicit || expandedSectionsById[section.id] === false)
  const virtualRows = useMemo(
    () => buildLogVirtualRows(sections, expandedSectionsById, expandedById),
    [expandedById, expandedSectionsById, sections],
  )
  const lineRowIndexById = useMemo(() => {
    const indexes = new Map<string, number>()
    for (const [index, row] of virtualRows.entries()) {
      if (row.kind === "line") {
        indexes.set(row.line.id, index)
      }
    }
    return indexes
  }, [virtualRows])
  const headerRowIndexes = useMemo(
    () =>
      virtualRows.flatMap((row, index) =>
        row.kind === "section" || row.kind === "block" ? [index] : [],
      ),
    [virtualRows],
  )
  const activeStickyIndexRef = useRef(-1)
  const rangeExtractor = useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const latestHeaderIndex = headerRowIndexes.findLast((index) => index <= range.startIndex)
      activeStickyIndexRef.current =
        latestHeaderIndex !== undefined && virtualRows[latestHeaderIndex]?.kind === "block"
          ? latestHeaderIndex
          : -1
      const indexes = new Set(defaultRangeExtractor(range))
      if (activeStickyIndexRef.current >= 0) {
        indexes.add(activeStickyIndexRef.current)
      }
      return [...indexes].sort((left, right) => left - right)
    },
    [headerRowIndexes, virtualRows],
  )
  const rowVirtualizer = useVirtualizer({
    count: virtualRows.length,
    estimateSize: (index) => estimateLogRowSize(virtualRows[index]),
    getItemKey: (index) => virtualRows[index]?.key ?? index,
    getScrollElement: () => viewportRef.current,
    overscan: LOG_VIRTUAL_OVERSCAN,
    rangeExtractor,
  })

  useEffect(() => {
    if (!latestTail) {
      return
    }
    setSessionLines((history) => {
      return mergeBoundedLogEntryTail(history, latestTail, LOG_SESSION_LINE_LIMIT)
    })
  }, [latestTail])

  useEffect(() => {
    setExpandedById((current) =>
      reconcileLogBlockExpansion(
        current,
        blocks.map((block) => block.id),
      ),
    )
    setExpandedSectionsById((current) =>
      reconcileLogBlockExpansion(
        current,
        sections.map((section) => section.id),
      ),
    )
  }, [blocks, sections])

  const stopScrollAnimation = useCallback(() => {
    scrollAnimationRef.current?.stop()
    scrollAnimationRef.current = null
    programmaticScrollRef.current = false
  }, [])

  const markUserScrollIntent = useCallback(() => {
    stopScrollAnimation()
    if (resumeFollowingTimerRef.current) {
      clearTimeout(resumeFollowingTimerRef.current)
      resumeFollowingTimerRef.current = null
    }
    userScrollIntentRef.current = true
    if (userScrollIntentTimerRef.current) {
      clearTimeout(userScrollIntentTimerRef.current)
    }
    userScrollIntentTimerRef.current = setTimeout(() => {
      userScrollIntentRef.current = false
      userScrollIntentTimerRef.current = null
    }, 240)
  }, [stopScrollAnimation])

  const scrollViewportTo = useCallback(
    (targetTop: number, animated: boolean) => {
      const viewport = viewportRef.current
      if (!viewport) {
        return
      }

      stopScrollAnimation()
      const maximumTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      const top = Math.min(Math.max(0, targetTop), maximumTop)
      programmaticScrollRef.current = true

      if (!animated || reduceMotion) {
        viewport.scrollTop = top
        requestAnimationFrame(() => {
          programmaticScrollRef.current = false
        })
        return
      }

      scrollAnimationRef.current = animate(viewport.scrollTop, top, {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
        onComplete: () => {
          viewport.scrollTop = top
          programmaticScrollRef.current = false
          scrollAnimationRef.current = null
        },
        onUpdate: (value) => {
          viewport.scrollTop = value
        },
      })
    },
    [reduceMotion, stopScrollAnimation],
  )

  useEffect(() => {
    if (!following || !lastRawLine) {
      return
    }

    // Wait for block layout before measuring. This also avoids Safari using the previous
    // scrollHeight while an expanded block is committing.
    const frame = requestAnimationFrame(() => {
      const viewport = viewportRef.current
      if (!viewport) {
        return
      }
      scrollViewportTo(viewport.scrollHeight, hasInitialScrollRef.current)
      hasInitialScrollRef.current = true
    })
    return () => cancelAnimationFrame(frame)
  }, [following, lastRawLine, scrollViewportTo])

  useEffect(() => {
    if (!searchActive || !currentBlockId || !currentLineId) {
      return
    }

    setFollowing(false)
    setExpandedById((current) =>
      current[currentBlockId] === true ? current : { ...current, [currentBlockId]: true },
    )
    if (currentSectionId) {
      setExpandedSectionsById((current) =>
        current[currentSectionId] === true ? current : { ...current, [currentSectionId]: true },
      )
    }
  }, [currentBlockId, currentLineId, currentSectionId, searchActive])

  useEffect(() => {
    if (!searchActive || !currentLineId) {
      return
    }
    const rowIndex = lineRowIndexById.get(currentLineId)
    if (rowIndex === undefined) {
      return
    }

    // Virtual rows outside the viewport do not have DOM nodes. TanStack Virtual's measured or
    // estimated offset lets Motion animate directly to a search result without mounting all rows.
    const frame = requestAnimationFrame(() => {
      const target = rowVirtualizer.getOffsetForIndex(rowIndex, "center")
      if (target) {
        scrollViewportTo(target[0], true)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [currentLineId, lineRowIndexById, rowVirtualizer, scrollViewportTo, searchActive])

  useEffect(
    () => () => {
      stopScrollAnimation()
      if (followSuppressionTimerRef.current) {
        clearTimeout(followSuppressionTimerRef.current)
      }
      if (userScrollIntentTimerRef.current) {
        clearTimeout(userScrollIntentTimerRef.current)
      }
      if (resumeFollowingTimerRef.current) {
        clearTimeout(resumeFollowingTimerRef.current)
      }
    },
    [stopScrollAnimation],
  )

  function navigateMatch(direction: 1 | -1) {
    if (matches.length === 0) {
      return
    }
    setCurrentMatchIndex((current) => (current + direction + matches.length) % matches.length)
  }

  function prepareDisclosureToggle() {
    stopScrollAnimation()
    if (resumeFollowingTimerRef.current) {
      clearTimeout(resumeFollowingTimerRef.current)
      resumeFollowingTimerRef.current = null
    }
    userScrollIntentRef.current = false
    if (userScrollIntentTimerRef.current) {
      clearTimeout(userScrollIntentTimerRef.current)
      userScrollIntentTimerRef.current = null
    }
    setFollowing(false)
    suppressFollowFromLayoutRef.current = true
    if (followSuppressionTimerRef.current) {
      clearTimeout(followSuppressionTimerRef.current)
    }
    // Collapsing can make the browser clamp scrollTop and emit a synthetic scroll event. Ignore
    // that layout-driven event so only a later user scroll can resume following.
    followSuppressionTimerRef.current = setTimeout(
      () => {
        suppressFollowFromLayoutRef.current = false
        followSuppressionTimerRef.current = null
      },
      reduceMotion ? 0 : 240,
    )
  }

  function toggleBlock(block: LogBlock, expanded: boolean) {
    prepareDisclosureToggle()
    setExpandedById((current) => ({ ...current, [block.id]: !expanded }))
  }

  function toggleSection(section: LogSection, expanded: boolean) {
    prepareDisclosureToggle()
    setExpandedSectionsById((current) => ({ ...current, [section.id]: !expanded }))
  }

  function toggleAll() {
    if (blocks.length === 0) {
      return
    }

    prepareDisclosureToggle()
    setExpandedById(Object.fromEntries(blocks.map((block) => [block.id, allCollapsed] as const)))
    setExpandedSectionsById(
      Object.fromEntries(sections.map((section) => [section.id, allCollapsed] as const)),
    )

    if (allCollapsed) {
      // Log disclosures intentionally have no height animation. Waiting one frame is enough for
      // React to commit the bounded 500-line window before the follow effect measures scrollHeight.
      resumeFollowingTimerRef.current = setTimeout(() => {
        resumeFollowingTimerRef.current = null
        setFollowing(true)
      }, 0)
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col">
      <PageHeading title="实时日志" detail="当前通过 REST 轮询；切换到其他页面后会自动停止。" />
      <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.75)]">
        <div className="flex shrink-0 flex-col gap-3 border-white/10 border-b px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 gap-2">
            <button
              className="flex size-11 shrink-0 items-center justify-center rounded-[0.85rem] bg-white/8 text-slate-300 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/8 disabled:hover:text-slate-300"
              type="button"
              aria-label={allCollapsed ? "全部展开日志并定位到底部" : "全部收起日志"}
              title={allCollapsed ? "全部展开并定位到底部" : "全部收起"}
              disabled={blocks.length === 0}
              onClick={toggleAll}
            >
              {allCollapsed ? (
                <ChevronsUpDown className="size-4" aria-hidden="true" />
              ) : (
                <ChevronsDownUp className="size-4" aria-hidden="true" />
              )}
            </button>
            <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[0.85rem] bg-white/8 px-3 text-slate-300 focus-within:ring-2 focus-within:ring-blue-400/70">
              <Search className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span className="sr-only">搜索日志</span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
                type="search"
                value={search}
                placeholder="搜索日志"
                autoComplete="off"
                aria-describedby="log-search-hint log-search-status"
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentMatchIndex(0)
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return
                  }
                  event.preventDefault()
                  navigateMatch(event.shiftKey ? -1 : 1)
                }}
              />
              <span
                id="log-search-status"
                className="shrink-0 text-slate-300 text-xs tabular-nums"
                aria-live="polite"
              >
                {searchActive
                  ? `${matches.length === 0 ? 0 : normalizedMatchIndex + 1}/${matches.length}`
                  : null}
              </span>
              <span
                id="log-search-hint"
                className="hidden shrink-0 text-[0.65rem] text-slate-400 lg:inline"
              >
                Enter / ⇧ Enter
              </span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              className="flex min-h-11 items-center gap-2 rounded-[0.85rem] bg-white/8 px-3.5 font-medium text-slate-300 text-xs transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
              type="button"
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {paused ? "继续" : "暂停"}
            </button>
            <button
              className="flex min-h-11 items-center gap-2 rounded-[0.85rem] bg-white/8 px-3.5 font-medium text-slate-300 text-xs transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
              type="button"
              onClick={() => {
                setFollowing(true)
                const viewport = viewportRef.current
                if (viewport) {
                  scrollViewportTo(viewport.scrollHeight, true)
                }
              }}
            >
              <RefreshCw className={cn("size-3.5", logs.isFetching && "animate-spin")} />
              跟随末尾
            </button>
          </div>
        </div>

        {logs.isError ? (
          <div className="px-5 py-4 text-red-300 text-sm" role="alert">
            <span className="wrap-break-word">日志读取失败：{logs.error.message}</span>
          </div>
        ) : null}
        <div
          ref={viewportRef}
          className="min-h-0 flex-1 overflow-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:-outline-offset-2"
          role="log"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to focus and scroll the log viewport.
          tabIndex={0}
          aria-label={`${instance} 实时日志`}
          aria-live={paused ? "off" : "polite"}
          onPointerDown={markUserScrollIntent}
          onTouchStart={markUserScrollIntent}
          onWheel={markUserScrollIntent}
          onKeyDown={(event) => {
            if (
              ["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "].includes(event.key)
            ) {
              markUserScrollIntent()
            }
          }}
          onScroll={(event) => {
            if (
              programmaticScrollRef.current ||
              suppressFollowFromLayoutRef.current ||
              !userScrollIntentRef.current
            ) {
              return
            }
            const target = event.currentTarget
            const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 36
            setFollowing((current) => (current === nearBottom ? current : nearBottom))
            if (userScrollIntentTimerRef.current) {
              clearTimeout(userScrollIntentTimerRef.current)
            }
            userScrollIntentTimerRef.current = setTimeout(() => {
              userScrollIntentRef.current = false
              userScrollIntentTimerRef.current = null
            }, 240)
          }}
        >
          {blocks.length > 0 ? (
            <div
              className="relative min-w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const row = virtualRows[virtualItem.index]
                if (!row) {
                  return null
                }
                const activeSticky =
                  row.kind === "block" && virtualItem.index === activeStickyIndexRef.current

                return (
                  <div
                    key={virtualItem.key}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualItem.index}
                    className={cn("left-0 w-full", activeSticky && "z-30")}
                    style={
                      activeSticky
                        ? { position: "sticky", top: 0 }
                        : {
                            position: "absolute",
                            top: 0,
                            transform: `translateY(${virtualItem.start}px)`,
                          }
                    }
                  >
                    {row.kind === "section" ? (
                      <LogSectionHeader
                        section={row.section}
                        expanded={row.expanded}
                        onToggle={() => toggleSection(row.section, row.expanded)}
                      />
                    ) : row.kind === "block" ? (
                      <LogBlockHeader
                        block={row.block}
                        expanded={row.expanded}
                        nested={row.nested}
                        onToggle={() => toggleBlock(row.block, row.expanded)}
                      />
                    ) : (
                      <div className="min-w-max font-mono text-[0.72rem] text-slate-300 leading-5.5">
                        <LogLine
                          line={row.line}
                          current={row.line.id === currentMatch?.lineId}
                          nested={row.nested}
                          search={search}
                          searchActive={searchActive}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : logs.isPending ? (
            <LogViewportSkeleton />
          ) : (
            <div className="flex min-h-64 items-center justify-center px-6 text-center text-slate-500 text-sm">
              日志暂时为空
            </div>
          )}
        </div>
        <footer className="flex shrink-0 items-center justify-between border-white/10 border-t px-4 py-2 text-[0.68rem] text-slate-400">
          <span>
            {paused ? "已暂停轮询" : "每 2 秒刷新"} · {following ? "自动跟随" : "已离开末尾"}
          </span>
          <span>
            最近 {rawLines.length}/{LOG_SESSION_LINE_LIMIT} 行 · 后端窗口 {latestTail?.length ?? 0}
          </span>
        </footer>
      </section>
    </div>
  )
}
