import type { JanusApiClient } from "@janus/api-client/client"
import { cn } from "@janus/ui/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { Pause, Play, RefreshCw, Search } from "lucide-react"
import { animate, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { logsQueryOptions } from "../../api/queries"
import {
  findLogMatches,
  type LogBlock,
  type LogSection,
  type LogSourceLine,
  mergeLogEntryTail,
  normalizeLogSearch,
  parseLogSections,
  reconcileLogBlockExpansion,
} from "../instance-detail-utils"
import { LogViewportSkeleton } from "./instance-detail-skeletons"
import { InstanceLogSection } from "./instance-log-view"
import { PageHeading } from "./instance-panel-primitives"

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

  useEffect(() => {
    if (!latestTail) {
      return
    }
    setSessionLines((history) => mergeLogEntryTail(history, latestTail))
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

    // Expanding changes the target offset. Two animation frames make the measurement reliable
    // after React commits and after WebKit completes layout.
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        const viewport = viewportRef.current
        const line = document.getElementById(currentLineId)
        if (!viewport || !line) {
          return
        }

        const viewportRect = viewport.getBoundingClientRect()
        const lineRect = line.getBoundingClientRect()
        const targetTop =
          viewport.scrollTop +
          lineRect.top -
          viewportRect.top -
          viewport.clientHeight / 2 +
          lineRect.height / 2
        scrollViewportTo(targetTop, true)
      })
    })

    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [currentBlockId, currentLineId, currentSectionId, scrollViewportTo, searchActive])

  useEffect(
    () => () => {
      stopScrollAnimation()
      if (followSuppressionTimerRef.current) {
        clearTimeout(followSuppressionTimerRef.current)
      }
      if (userScrollIntentTimerRef.current) {
        clearTimeout(userScrollIntentTimerRef.current)
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

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col">
      <PageHeading title="实时日志" detail="当前通过 REST 轮询；切换到其他页面后会自动停止。" />
      <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.75)]">
        <div className="flex shrink-0 flex-col gap-3 border-white/10 border-b px-4 py-3 sm:flex-row sm:items-center">
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
            <div className="min-w-full divide-y divide-white/8 py-1">
              {sections.map((section, index) => {
                const expanded = expandedSectionsById[section.id] ?? index === sections.length - 1
                return (
                  <InstanceLogSection
                    key={section.id}
                    section={section}
                    currentLineId={currentMatch?.lineId ?? null}
                    expanded={expanded}
                    expandedByBlockId={expandedById}
                    reduceMotion={Boolean(reduceMotion)}
                    search={search}
                    searchActive={searchActive}
                    onToggleBlock={toggleBlock}
                    onToggleSection={() => toggleSection(section, expanded)}
                  />
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
            会话缓存 {rawLines.length} 行 · 后端窗口 {latestTail?.length ?? 0}
          </span>
        </footer>
      </section>
    </div>
  )
}
