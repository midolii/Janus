import type { JanusApiClient } from "@janus/api-client/client"
import type {
  ConfigFieldResponse,
  ConfigResponse,
  ConfigSchemaResponse,
  TaskListResponse,
  TaskResponse,
} from "@janus/api-client/contracts"
import { Button } from "@janus/ui/components/button"
import { cn } from "@janus/ui/lib/utils"
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  Clock3,
  FileCog,
  Info,
  ListTodo,
  LockKeyhole,
  Logs,
  Pause,
  Play,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SquareTerminal,
  Wifi,
  WifiOff,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { InstanceDetailTab } from "./instance-detail-tabs"
import { filterLogLines, formatConfigValue, getConfigValue } from "./instance-detail-utils"
import {
  configQueryOptions,
  configSchemaQueryOptions,
  instanceQueryOptions,
  logsQueryOptions,
  queryKeys,
  tasksQueryOptions,
} from "./queries"

export interface InstanceDetailProps {
  api: JanusApiClient
  instance: string
  platform: "web" | "electron"
  activeTab?: InstanceDetailTab
  onTabChange?: (tab: InstanceDetailTab) => void
  onBack: () => void
}

const tabItems = [
  { key: "overview", label: "概览", icon: Info },
  { key: "tasks", label: "任务", icon: ListTodo },
  { key: "config", label: "配置", icon: Settings2 },
  { key: "logs", label: "日志", icon: Logs },
] as const

const taskGroups = [
  { key: "running", label: "运行中", icon: Activity, tone: "text-emerald-700" },
  { key: "pending", label: "待执行", icon: Clock3, tone: "text-blue-700" },
  { key: "waiting", label: "等待中", icon: CircleDashed, tone: "text-amber-700" },
  { key: "disabled", label: "已停用", icon: CircleDashed, tone: "text-slate-400" },
] as const

export function InstanceDetail({
  api,
  instance,
  platform,
  activeTab,
  onTabChange,
  onBack,
}: InstanceDetailProps) {
  const [localTab, setLocalTab] = useState<InstanceDetailTab>("overview")
  const currentTab = activeTab ?? localTab
  const queryClient = useQueryClient()
  const logFetches = useIsFetching({ queryKey: queryKeys.logs(instance, 200) })
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

  function changeTab(tab: InstanceDetailTab) {
    if (onTabChange) {
      onTabChange(tab)
      return
    }

    setLocalTab(tab)
  }

  async function refreshVisibleData() {
    const requests: Promise<unknown>[] = [instanceQuery.refetch()]
    if (currentTab === "overview" || currentTab === "tasks") {
      requests.push(tasks.refetch())
    }
    if (currentTab === "config") {
      requests.push(config.refetch(), configSchema.refetch())
    }
    if (currentTab === "logs") {
      requests.push(
        queryClient.refetchQueries({ queryKey: queryKeys.logs(instance, 200), exact: true }),
      )
    }
    await Promise.all(requests)
  }

  const fetching =
    instanceQuery.isFetching ||
    tasks.isFetching ||
    config.isFetching ||
    configSchema.isFetching ||
    logFetches > 0

  return (
    <div className="app-viewport overflow-hidden p-3 text-slate-950 sm:p-5 lg:p-6">
      <div className="mx-auto flex h-full max-w-[1540px] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/62 shadow-[0_28px_80px_-34px_rgba(30,64,83,0.45)] backdrop-blur-[34px] lg:rounded-[2.25rem]">
        <header className="flex shrink-0 items-center gap-3 border-white/65 border-b bg-white/42 px-4 py-3 sm:px-5 sm:py-4">
          <Button
            className="size-11 rounded-full border-white/80 bg-white/65 backdrop-blur-xl hover:bg-white/90"
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="返回仪表盘"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-semibold text-lg tracking-[-0.025em] sm:text-xl">
                {instanceQuery.data?.name ?? instance}
              </h1>
              <span
                className={cn(
                  "size-2 rounded-full",
                  instanceQuery.data?.running ? "bg-emerald-500" : "bg-slate-300",
                )}
                aria-hidden="true"
              />
            </div>
            <p className="truncate text-slate-500 text-xs">
              {instanceQuery.data?.module ?? "正在读取实例"} · {platform}
            </p>
          </div>
          <Button
            className="size-11 rounded-full border-white/80 bg-white/65 backdrop-blur-xl hover:bg-white/90"
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="刷新当前页面"
            disabled={fetching}
            onClick={() => void refreshVisibleData()}
          >
            <RefreshCw className={cn("size-4", fetching && "animate-spin")} />
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden min-h-0 flex-col overflow-y-auto border-white/65 border-r bg-white/28 p-4 lg:flex">
            <p className="px-3 font-medium text-slate-400 text-xs">实例导航</p>
            <nav className="mt-2 space-y-1" aria-label="实例详情导航">
              {tabItems.map((tab) => (
                <TabButton
                  key={tab.key}
                  active={currentTab === tab.key}
                  icon={tab.icon}
                  label={tab.label}
                  onClick={() => changeTab(tab.key)}
                />
              ))}
            </nav>

            <div className="mt-auto pt-8">
              <div className="rounded-[1rem] bg-white/52 px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 text-slate-500" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 text-xs">只读连接</p>
                    <p className="truncate text-[0.68rem] text-slate-500">写操作尚未开放</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col bg-[rgba(248,251,252,0.34)]">
            <div
              className="flex shrink-0 gap-1 overflow-x-auto border-white/65 border-b bg-white/32 px-3 py-2 lg:hidden"
              role="tablist"
              aria-label="实例详情"
            >
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-[0.85rem] px-3.5 font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                    currentTab === tab.key
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-950",
                  )}
                  type="button"
                  role="tab"
                  aria-selected={currentTab === tab.key}
                  onClick={() => changeTab(tab.key)}
                >
                  <tab.icon className="size-4" aria-hidden="true" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
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
              {currentTab === "logs" ? <LogsPanel api={api} instance={instance} /> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Info
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-[0.9rem] px-3.5 text-left font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
        active
          ? "bg-slate-950 text-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.8)]"
          : "text-slate-600 hover:bg-white/55 hover:text-slate-950",
      )}
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <Icon className="size-[1.05rem]" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {active ? <ChevronRight className="size-3.5 text-white/55" aria-hidden="true" /> : null}
    </button>
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
    <div className="mx-auto max-w-5xl">
      <PageHeading title="实例概览" detail="确认运行状态和最近的任务队列。" />
      <section className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(130deg,rgba(22,99,140,0.98),rgba(18,61,88,0.96))] p-5 text-white shadow-[0_24px_54px_-32px_rgba(12,61,88,0.8)] sm:p-7">
        <div className="flex items-center gap-2 text-blue-100 text-sm">
          {instanceData?.running ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
          <span>{instanceData?.running ? "实例正在运行" : "实例当前未运行"}</span>
        </div>
        <h2 className="mt-5 font-semibold text-3xl tracking-[-0.04em]">
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
    <div className="mx-auto max-w-5xl">
      <PageHeading title="任务队列" detail="查看所有活动、等待和停用任务。" />
      <section className="mt-6 overflow-hidden rounded-[1.75rem] bg-white/62 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
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
      <time
        className="shrink-0 text-slate-500 text-xs tabular-nums"
        dateTime={task.nextRun ?? undefined}
      >
        {formatNextRun(task.nextRun)}
      </time>
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

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading title="配置浏览" detail="当前为只读模式；写入接口开放后将在此启用编辑。" />
      <div className="mt-6 grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-[1.5rem] bg-white/62 p-3 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
          <p className="px-3 py-2 font-medium text-slate-400 text-xs">配置分区</p>
          <div className="flex gap-1 overflow-x-auto xl:block xl:space-y-1">
            {schema.menus.map((menu) => (
              <button
                key={menu.name}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-[0.85rem] px-3 text-left font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 xl:w-full",
                  menu.name === selectedMenu.name
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-950",
                )}
                type="button"
                onClick={() => {
                  setSelectedMenuName(menu.name)
                  setSelectedTaskName(null)
                }}
              >
                <FileCog className="size-4" aria-hidden="true" />
                <span className="truncate">{menu.displayName || menu.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[1.5rem] bg-white/62 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
          <div className="border-slate-900/6 border-b px-5 py-5 sm:px-6">
            <h2 className="font-semibold text-lg tracking-[-0.025em]">
              {selectedMenu.displayName || selectedMenu.name}
            </h2>
            {selectedMenu.tasks.length > 1 ? (
              <div className="mt-4 flex gap-1 overflow-x-auto rounded-[0.95rem] bg-slate-900/[0.035] p-1">
                {selectedMenu.tasks.map((task) => (
                  <button
                    key={task.name}
                    className={cn(
                      "min-h-11 shrink-0 rounded-[0.72rem] px-3 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                      task.name === selectedTask.name
                        ? "bg-white text-slate-950 shadow-[0_5px_14px_-10px_rgba(15,23,42,0.7)]"
                        : "text-slate-500 hover:text-slate-950",
                    )}
                    type="button"
                    onClick={() => setSelectedTaskName(task.name)}
                  >
                    {task.displayName || task.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="divide-y divide-slate-900/6">
            {selectedTask.groups.map((group) => (
              <section key={group.name} className="px-5 py-5 sm:px-6">
                <h3 className="font-medium text-sm">{group.displayName || group.name}</h3>
                {group.help ? (
                  <p className="mt-1 text-slate-500 text-xs leading-5">{group.help}</p>
                ) : null}
                <dl className="mt-4 grid gap-2 lg:grid-cols-2">
                  {group.fields.map((field) => (
                    <ConfigField
                      key={field.key}
                      field={field}
                      value={getConfigValue(config.values, field.key)}
                      redacted={config.redactedPaths.includes(field.key)}
                    />
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ConfigField({
  field,
  value,
  redacted,
}: {
  field: ConfigFieldResponse
  value: unknown
  redacted: boolean
}) {
  const option = field.options.find((item) => Object.is(item.value, value))
  const displayValue =
    redacted || field.sensitive ? "••••••" : (option?.label ?? formatConfigValue(value))
  const booleanValue = typeof value === "boolean" ? value : undefined

  return (
    <div className="rounded-[1rem] bg-slate-900/[0.035] px-4 py-3.5">
      <dt className="flex items-start justify-between gap-3">
        <span className="font-medium text-sm">{field.displayName || field.name}</span>
        {field.readOnly || field.display === "disabled" ? (
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-label="只读" />
        ) : null}
      </dt>
      <dd className="mt-2 flex min-h-6 items-center gap-2 text-slate-600 text-sm">
        {booleanValue !== undefined && !redacted && !field.sensitive ? (
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md",
              booleanValue ? "bg-blue-600 text-white" : "bg-slate-200 text-transparent",
            )}
            aria-hidden="true"
          >
            <Check className="size-3.5" />
          </span>
        ) : null}
        <span className="min-w-0 break-words">{displayValue}</span>
      </dd>
      {field.help ? <p className="mt-2 text-slate-500 text-xs leading-5">{field.help}</p> : null}
    </div>
  )
}

function LogsPanel({ api, instance }: { api: JanusApiClient; instance: string }) {
  const [paused, setPaused] = useState(false)
  const [following, setFollowing] = useState(true)
  const [filter, setFilter] = useState("")
  const viewportRef = useRef<HTMLDivElement>(null)
  const logs = useQuery({
    ...logsQueryOptions(api, instance, 200),
    refetchInterval: paused ? false : 2_000,
  })
  const lines = useMemo(
    () => filterLogLines(logs.data?.lines ?? [], filter),
    [filter, logs.data?.lines],
  )
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 22,
    overscan: 16,
  })

  useEffect(() => {
    if (!following || lines.length === 0) {
      return
    }

    // Schedule after layout so Safari and Chromium observe the virtualizer's latest total size.
    const frame = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(lines.length - 1, { align: "end" })
    })
    return () => cancelAnimationFrame(frame)
  }, [following, lines.length, virtualizer])

  return (
    <div className="mx-auto flex h-full min-h-[32rem] max-w-6xl flex-col">
      <PageHeading title="实时日志" detail="当前通过 REST 轮询；切换到其他页面后会自动停止。" />
      <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.75)]">
        <div className="flex shrink-0 flex-col gap-3 border-white/10 border-b px-4 py-3 sm:flex-row sm:items-center">
          <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[0.85rem] bg-white/8 px-3 text-slate-300 focus-within:ring-2 focus-within:ring-blue-400/70">
            <Search className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span className="sr-only">过滤日志</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
              type="search"
              value={filter}
              placeholder="过滤日志"
              autoComplete="off"
              onChange={(event) => setFilter(event.target.value)}
            />
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
                if (lines.length > 0) {
                  virtualizer.scrollToIndex(lines.length - 1, { align: "end" })
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
            日志读取失败：{logs.error.message}
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
          onScroll={(event) => {
            const target = event.currentTarget
            const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 36
            setFollowing((current) => (current === nearBottom ? current : nearBottom))
          }}
        >
          {lines.length > 0 ? (
            <div
              className="relative min-w-full font-mono text-[0.72rem] text-slate-300 leading-[1.375rem]"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((row) => (
                <div
                  key={row.key}
                  className="absolute top-0 left-0 min-w-full whitespace-pre px-4 hover:bg-white/[0.035]"
                  style={{ transform: `translateY(${row.start}px)` }}
                >
                  {lines[row.index]}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center px-6 text-center text-slate-500 text-sm">
              {logs.isPending ? "正在读取日志…" : filter ? "没有匹配的日志" : "日志暂时为空"}
            </div>
          )}
        </div>
        <footer className="flex shrink-0 items-center justify-between border-white/10 border-t px-4 py-2 text-[0.68rem] text-slate-400">
          <span>{paused ? "已暂停轮询" : "每 2 秒刷新"}</span>
          <span>{lines.length} 行</span>
        </footer>
      </section>
    </div>
  )
}

function PageHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <h2 className="font-semibold text-2xl tracking-[-0.035em] sm:text-[1.75rem]">{title}</h2>
      <p className="mt-1 text-slate-500 text-sm">{detail}</p>
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
      <h2 className="mt-4 font-medium text-sm">{title}</h2>
      <p className="mt-1.5 max-w-sm text-slate-500 text-xs leading-5">{detail}</p>
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
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="mt-0.5 text-red-800/75 text-xs leading-5">{detail}</p>
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

function formatNextRun(value: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
    day: "numeric",
  }).format(date)
}
