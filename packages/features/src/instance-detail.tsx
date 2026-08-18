import type { JanusApiClient } from "@janus/api-client/client"
import type {
  ConfigResponse,
  ConfigSchemaResponse,
  TaskListResponse,
  TaskResponse,
} from "@janus/api-client/contracts"
import { DateDisplay } from "@janus/ui/components/date-display"
import { cn } from "@janus/ui/lib/utils"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  Clock3,
  FileCog,
  Pause,
  Play,
  RefreshCw,
  Search,
  SquareTerminal,
  Wifi,
  WifiOff,
} from "lucide-react"
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ConfigGroupRenderer } from "./config-group-renderer"
import type { InstanceDetailTab } from "./instance-detail-tabs"
import {
  findLogMatches,
  type LogBlock,
  mergeLogTail,
  normalizeLogSearch,
  type ParsedLogLine,
  parseLogBlocks,
} from "./instance-detail-utils"
import {
  configQueryOptions,
  configSchemaQueryOptions,
  instanceQueryOptions,
  logsQueryOptions,
  tasksQueryOptions,
} from "./queries"

export interface InstanceDetailProps {
  api: JanusApiClient
  instance: string
  activeTab: InstanceDetailTab
}

const taskGroups = [
  { key: "running", label: "运行中", icon: Activity, tone: "text-emerald-700" },
  { key: "pending", label: "待执行", icon: Clock3, tone: "text-blue-700" },
  { key: "waiting", label: "等待中", icon: CircleDashed, tone: "text-amber-700" },
  { key: "disabled", label: "已停用", icon: CircleDashed, tone: "text-slate-400" },
] as const

export function InstanceDetail({ api, instance, activeTab }: InstanceDetailProps) {
  const currentTab = activeTab
  const instanceQuery = useQuery(instanceQueryOptions(api, instance))
  const tasks = useQuery({
    ...tasksQueryOptions(api, instance),
    enabled: currentTab === "overview" || currentTab === "tasks",
  })
  const config = useQuery({
    ...configQueryOptions(api, instance),
    enabled: currentTab === "config",
  })
  const configSchema = useQuery({
    ...configSchemaQueryOptions(api, instance),
    enabled: currentTab === "config",
  })

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[rgba(248,251,252,0.34)]">
      <div className="min-h-0 flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
        {instanceQuery.isError ? (
          <ErrorPanel title="实例读取失败" detail={instanceQuery.error.message} />
        ) : null}
        {currentTab === "overview" ? (
          <OverviewPanel instanceData={instanceQuery.data} tasks={tasks.data} />
        ) : null}
        {currentTab === "tasks" ? (
          <TasksPanel data={tasks.data} pending={tasks.isPending} error={tasks.error} />
        ) : null}
        {currentTab === "config" ? (
          <ConfigPanel
            config={config.data}
            schema={configSchema.data}
            pending={config.isPending || configSchema.isPending}
            error={config.error ?? configSchema.error}
          />
        ) : null}
        {currentTab === "logs" ? <LogsPanel key={instance} api={api} instance={instance} /> : null}
      </div>
    </main>
  )
}

function OverviewPanel({
  instanceData,
  tasks,
}: {
  instanceData?: { name: string; module: string; running: boolean; state: string }
  tasks?: TaskListResponse
}) {
  const activeTasks = (tasks?.running.length ?? 0) + (tasks?.pending.length ?? 0)

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
      <PageHeading title="实例概览" detail="确认运行状态和最近的任务队列。" />
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[1.75rem]">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(130deg,rgba(22,99,140,0.98),rgba(18,61,88,0.96))] p-5 text-white shadow-[0_24px_54px_-32px_rgba(12,61,88,0.8)] sm:p-7">
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            {instanceData?.running ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
            <span>{instanceData?.running ? "实例正在运行" : "实例当前未运行"}</span>
          </div>
          <h2
            className="mt-5 truncate font-semibold text-3xl tracking-[-0.04em]"
            title={instanceData?.name ?? "读取中"}
          >
            {instanceData?.name ?? "读取中"}
          </h2>
          <dl className="mt-7 grid gap-px overflow-hidden rounded-[1.1rem] bg-white/15 sm:grid-cols-3">
            <OverviewFact label="模块" value={instanceData?.module ?? "—"} />
            <OverviewFact label="核心状态" value={localizeState(instanceData?.state)} />
            <OverviewFact label="活动任务" value={String(activeTasks)} />
          </dl>
        </section>

        <section className="mt-6 rounded-[1.75rem] bg-white/62 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-[1.05rem] tracking-[-0.02em]">队列摘要</h2>
              <p className="mt-1 text-slate-500 text-xs">任务数据每 3 秒自动更新</p>
            </div>
            <SquareTerminal className="size-5 text-slate-400" aria-hidden="true" />
          </div>
          {tasks ? <TaskSummary tasks={tasks} /> : <PanelSkeleton rows={3} />}
        </section>
      </div>
    </div>
  )
}

function OverviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/8 px-4 py-4 sm:px-5">
      <dt className="text-blue-100/75 text-xs">{label}</dt>
      <dd className="mt-1.5 truncate font-semibold text-lg tracking-[-0.025em]">{value}</dd>
    </div>
  )
}

function TaskSummary({ tasks }: { tasks: TaskListResponse }) {
  return (
    <dl className="mt-5 grid gap-3 sm:grid-cols-3">
      {taskGroups.slice(0, 3).map((group) => (
        <div key={group.key} className="rounded-[1rem] bg-slate-900/[0.035] px-4 py-3.5">
          <dt className="flex items-center gap-2 text-slate-500 text-xs">
            <group.icon className={cn("size-4", group.tone)} aria-hidden="true" />
            {group.label}
          </dt>
          <dd className="mt-2 font-semibold text-2xl tabular-nums">{tasks[group.key].length}</dd>
        </div>
      ))}
    </dl>
  )
}

function TasksPanel({
  data,
  pending,
  error,
}: {
  data?: TaskListResponse
  pending: boolean
  error: Error | null
}) {
  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
      <PageHeading title="任务队列" detail="查看所有活动、等待和停用任务。" />
      <section className="mt-6 min-h-0 flex-1 overflow-hidden rounded-[1.75rem] bg-white/62 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
        <div className="h-full overflow-y-auto overscroll-contain">
          {pending ? <PanelSkeleton rows={6} /> : null}
          {error ? <ErrorPanel title="任务读取失败" detail={error.message} compact /> : null}
          {data ? (
            <div className="divide-y divide-slate-900/6">
              {taskGroups.map((group) => (
                <section key={group.key} className="px-5 py-5 sm:px-6">
                  <div className="mb-3 flex items-center gap-2">
                    <group.icon className={cn("size-4", group.tone)} aria-hidden="true" />
                    <h2 className="font-medium text-slate-600 text-xs">{group.label}</h2>
                    <span className="text-slate-500 text-xs tabular-nums">
                      {data[group.key].length}
                    </span>
                  </div>
                  {data[group.key].length > 0 ? (
                    <div className="grid gap-1 lg:grid-cols-2">
                      {data[group.key].map((task) => (
                        <TaskRow key={task.name} task={task} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-3 text-slate-400 text-xs">此分组暂无任务</p>
                  )}
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function TaskRow({ task }: { task: TaskResponse }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-[0.95rem] px-3 transition-colors hover:bg-slate-900/[0.035]">
      <span
        className={cn("size-2 rounded-full", task.enabled ? "bg-blue-500" : "bg-slate-300")}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{task.displayName || task.name}</p>
        <p className="mt-0.5 truncate text-slate-500 text-xs">{localizeState(task.state)}</p>
      </div>
      <DateDisplay className="shrink-0 text-slate-500 text-xs tabular-nums" value={task.nextRun} />
    </div>
  )
}

function ConfigPanel({
  config,
  schema,
  pending,
  error,
}: {
  config?: ConfigResponse
  schema?: ConfigSchemaResponse
  pending: boolean
  error: Error | null
}) {
  const [selectedMenuName, setSelectedMenuName] = useState<string | null>(null)
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null)
  const [expandedMenuName, setExpandedMenuName] = useState<false | string | null>(null)
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // A selection from another instance may no longer exist. Falling back during render avoids
  // synchronization effects and keeps instance switches deterministic.
  const selectedMenu =
    schema?.menus.find((menu) => menu.name === selectedMenuName) ?? schema?.menus[0]
  const selectedTask =
    selectedMenu?.tasks.find((task) => task.name === selectedTaskName) ?? selectedMenu?.tasks[0]

  if (pending) {
    return <PanelSkeleton rows={8} />
  }

  if (error) {
    return <ErrorPanel title="配置读取失败" detail={error.message} />
  }

  if (!config || !schema || !selectedMenu || !selectedTask) {
    return <EmptyPanel title="没有可显示的配置" detail="此实例没有返回配置 Schema。" />
  }

  const selectedGroups = selectedTask.groups
  const openMenuName = expandedMenuName === null ? selectedMenu.name : expandedMenuName || null
  const currentGroup =
    selectedGroups.find((group) => group.name === activeGroupName) ?? selectedGroups[0]
  const currentGroupName = currentGroup?.name ?? null

  function selectTask(menuName: string, taskName: string, firstGroupName: string | null) {
    setSelectedMenuName(menuName)
    setSelectedTaskName(taskName)
    setActiveGroupName(firstGroupName)
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }

  function selectGroup(groupName: string) {
    setActiveGroupName(groupName)
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col">
      <PageHeading title="配置浏览" detail="当前为只读模式；写入接口开放后将在此启用编辑。" />
      <div className="mt-6 grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-5 xl:grid-cols-[15rem_minmax(0,1fr)] xl:grid-rows-1">
        <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-white/62 p-3 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
          <p className="px-3 py-2 font-medium text-slate-400 text-xs">配置分区</p>
          <div className="flex min-h-0 gap-1 overflow-x-auto overscroll-contain xl:block xl:flex-1 xl:space-y-1 xl:overflow-y-auto">
            {schema.menus.map((menu, menuIndex) => {
              const selected = menu.name === selectedMenu.name
              const expanded = menu.name === openMenuName
              const submenuId = `config-menu-${menuIndex}`
              const menuLabel = menu.displayName || menu.name
              return (
                <div key={menu.name} className="min-w-0 shrink-0 xl:w-full">
                  <button
                    className={cn(
                      "flex min-h-11 min-w-0 items-center gap-2 rounded-[0.85rem] px-3 text-left font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 xl:w-full",
                      selected
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-white/70 hover:text-slate-950",
                    )}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={submenuId}
                    title={menuLabel}
                    onClick={() => {
                      if (expanded) {
                        setExpandedMenuName(false)
                        return
                      }
                      setExpandedMenuName(menu.name)
                      setSelectedMenuName(menu.name)
                      setSelectedTaskName(null)
                      setActiveGroupName(menu.tasks[0]?.groups[0]?.name ?? null)
                      if (contentRef.current) {
                        contentRef.current.scrollTop = 0
                      }
                    }}
                  >
                    <FileCog className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{menuLabel}</span>
                    <ChevronRight
                      className={cn(
                        "size-3.5 shrink-0 text-current/55 transition-transform",
                        expanded && "rotate-90",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded ? (
                      <motion.div
                        id={submenuId}
                        key="submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.18,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 ml-4 space-y-0.5 border-slate-900/8 border-l pl-2">
                          {menu.tasks.map((task) => {
                            const taskLabel = task.displayName || task.name
                            const active = selected && task.name === selectedTask.name
                            return (
                              <button
                                key={task.name}
                                className={cn(
                                  "flex min-h-9 w-full min-w-0 items-center rounded-[0.72rem] px-3 text-left font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                                  active
                                    ? "bg-slate-900/[0.07] text-slate-950"
                                    : "text-slate-500 hover:bg-white/65 hover:text-slate-950",
                                )}
                                type="button"
                                aria-current={active ? "page" : undefined}
                                title={taskLabel}
                                onClick={() =>
                                  selectTask(menu.name, task.name, task.groups[0]?.name ?? null)
                                }
                              >
                                <span className="min-w-0 flex-1 truncate">{taskLabel}</span>
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-white/62 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
          <div className="shrink-0 border-slate-900/6 border-b px-5 py-5 sm:px-6">
            <p
              className="truncate text-slate-500 text-xs"
              title={selectedMenu.displayName || selectedMenu.name}
            >
              {selectedMenu.displayName || selectedMenu.name}
            </p>
            <h2
              className="mt-1 truncate font-semibold text-lg tracking-[-0.025em]"
              title={selectedTask.displayName || selectedTask.name}
            >
              {selectedTask.displayName || selectedTask.name}
            </h2>
            {selectedTask.help ? (
              <p className="mt-2 whitespace-pre-wrap break-words text-slate-500 text-xs leading-5">
                {selectedTask.help}
              </p>
            ) : null}
            {selectedGroups.length > 0 ? (
              <div
                className="mt-4 flex gap-1 overflow-x-auto overscroll-contain rounded-[0.95rem] bg-slate-900/[0.035] p-1"
                aria-label="配置块"
                role="tablist"
              >
                {selectedGroups.map((group) => {
                  const groupLabel = group.displayName || group.name
                  return (
                    <button
                      key={group.name}
                      className={cn(
                        "min-h-10 max-w-44 shrink-0 truncate rounded-[0.72rem] px-3 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                        group.name === currentGroupName
                          ? "bg-white text-slate-950 shadow-[0_5px_14px_-10px_rgba(15,23,42,0.7)]"
                          : "text-slate-500 hover:text-slate-950",
                      )}
                      type="button"
                      role="tab"
                      aria-selected={group.name === currentGroupName}
                      title={groupLabel}
                      onClick={() => selectGroup(group.name)}
                    >
                      {groupLabel}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {currentGroup ? (
              <ConfigGroupRenderer
                key={currentGroup.name}
                moduleName={schema.module}
                menu={selectedMenu}
                task={selectedTask}
                group={currentGroup}
                config={config}
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

function LogsPanel({ api, instance }: { api: JanusApiClient; instance: string }) {
  const [paused, setPaused] = useState(false)
  const [following, setFollowing] = useState(true)
  const [search, setSearch] = useState("")
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({})
  const [sessionLines, setSessionLines] = useState<string[]>([])
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
  const latestTail = logs.data?.lines
  const rawLines = sessionLines
  const blocks = useMemo(() => parseLogBlocks(rawLines), [rawLines])
  const matches = useMemo(() => findLogMatches(blocks, search), [blocks, search])
  const searchActive = normalizeLogSearch(search).length > 0
  const normalizedMatchIndex = matches.length > 0 ? currentMatchIndex % matches.length : 0
  const currentMatch = matches[normalizedMatchIndex] ?? null
  const currentBlockId = currentMatch?.blockId ?? null
  const currentLineId = currentMatch?.lineId ?? null
  const lastRawLine = rawLines.at(-1)

  useEffect(() => {
    if (!latestTail) {
      return
    }
    setSessionLines((history) => mergeLogTail(history, latestTail))
  }, [latestTail])

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
  }, [currentBlockId, currentLineId, scrollViewportTo, searchActive])

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

  function toggleBlock(block: LogBlock, expanded: boolean) {
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
    setExpandedById((current) => ({ ...current, [block.id]: !expanded }))
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
            <span className="break-words">日志读取失败：{logs.error.message}</span>
          </div>
        ) : null}
        <div
          ref={viewportRef}
          className="min-h-0 flex-1 overflow-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-[-2px]"
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
              {blocks.map((block, index) => {
                const expanded = expandedById[block.id] ?? index === blocks.length - 1
                return (
                  <LogBlockItem
                    key={block.id}
                    block={block}
                    currentLineId={currentMatch?.lineId ?? null}
                    expanded={expanded}
                    reduceMotion={Boolean(reduceMotion)}
                    search={search}
                    searchActive={searchActive}
                    onToggle={() => toggleBlock(block, expanded)}
                  />
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center px-6 text-center text-slate-500 text-sm">
              {logs.isPending ? "正在读取日志…" : "日志暂时为空"}
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

function LogBlockItem({
  block,
  currentLineId,
  expanded,
  reduceMotion,
  search,
  searchActive,
  onToggle,
}: {
  block: LogBlock
  currentLineId: string | null
  expanded: boolean
  reduceMotion: boolean
  search: string
  searchActive: boolean
  onToggle: () => void
}) {
  return (
    <article>
      <button
        className="flex min-h-12 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-white/[0.045] focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-[-2px]"
        type="button"
        aria-expanded={expanded}
        aria-controls={`${block.id}-content`}
        onClick={onToggle}
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-slate-500 transition-transform",
            expanded && "rotate-90",
          )}
          aria-hidden="true"
        />
        <DateDisplay
          className="shrink-0 font-mono text-[0.68rem] text-slate-500 tabular-nums"
          value={block.timestamp}
          options={{ day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" }}
        />
        <span
          className="min-w-0 flex-1 truncate font-medium text-slate-200 text-xs"
          title={block.title}
        >
          {block.title}
        </span>
        <span className="shrink-0 text-[0.65rem] text-slate-600 tabular-nums">
          {block.lines.length} 行
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id={`${block.id}-content`}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="min-w-max pb-2 font-mono text-[0.72rem] text-slate-300 leading-[1.375rem]">
              {block.lines.map((line) => (
                <LogLine
                  key={line.id}
                  line={line}
                  current={line.id === currentLineId}
                  search={search}
                  searchActive={searchActive}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  )
}

function LogLine({
  current,
  line,
  search,
  searchActive,
}: {
  current: boolean
  line: ParsedLogLine
  search: string
  searchActive: boolean
}) {
  return (
    <div
      id={line.id}
      aria-hidden={searchActive && !current ? true : undefined}
      className={cn(
        "whitespace-pre px-11 transition-[background-color,opacity] duration-200 hover:bg-white/[0.035]",
        searchActive && !current && "opacity-25",
        current && "bg-blue-400/10 text-white",
      )}
    >
      {current ? <HighlightedLogText text={line.raw} search={search} /> : line.raw}
    </div>
  )
}

function HighlightedLogText({ text, search }: { text: string; search: string }) {
  const keyword = normalizeLogSearch(search)
  const start = text.toLocaleLowerCase("zh-CN").indexOf(keyword)
  if (!keyword || start < 0) {
    return text
  }

  const end = start + keyword.length
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-amber-300/90 px-0.5 text-slate-950">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  )
}

function PageHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="min-w-0 shrink-0">
      <h2
        className="truncate font-semibold text-2xl tracking-[-0.035em] sm:text-[1.75rem]"
        title={title}
      >
        {title}
      </h2>
      <p className="mt-1 break-words text-slate-500 text-sm">{detail}</p>
    </div>
  )
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4 p-6" role="status" aria-label="正在加载">
      {Array.from({ length: rows }, (_, index) => `skeleton-${index}`).map((key) => (
        <div key={key} className="flex items-center gap-3">
          <div className="size-3 animate-pulse rounded-full bg-slate-900/8" />
          <div className="h-3 flex-1 animate-pulse rounded-full bg-slate-900/8" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-slate-900/5" />
        </div>
      ))}
    </div>
  )
}

function EmptyPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <CheckCircle2 className="size-6 text-slate-300" aria-hidden="true" />
      <h2 className="mt-4 max-w-full truncate font-medium text-sm" title={title}>
        {title}
      </h2>
      <p className="mt-1.5 max-w-sm break-words text-slate-500 text-xs leading-5">{detail}</p>
    </div>
  )
}

function ErrorPanel({
  title,
  detail,
  compact = false,
}: {
  title: string
  detail: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[1.25rem] bg-red-50/85 px-4 py-3.5 text-red-900 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.12)]",
        !compact && "mx-auto max-w-5xl",
      )}
      role="alert"
    >
      <CircleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate font-medium text-sm" title={title}>
          {title}
        </p>
        <p className="mt-0.5 break-words text-red-800/75 text-xs leading-5">{detail}</p>
      </div>
    </div>
  )
}

function localizeState(value?: string) {
  if (!value) {
    return "—"
  }

  const labels: Record<string, string> = {
    disabled: "已停用",
    idle: "空闲",
    pending: "待执行",
    running: "运行中",
    stopped: "已停止",
    waiting: "等待中",
  }
  return labels[value.toLowerCase()] ?? value
}
