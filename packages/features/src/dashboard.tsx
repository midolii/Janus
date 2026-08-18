import type { JanusApiClient } from "@janus/api-client/client"
import type { TaskListResponse, TaskResponse } from "@janus/api-client/contracts"
import { Button } from "@janus/ui/components/button"
import { DateDisplay } from "@janus/ui/components/date-display"
import { InstanceNavigation } from "@janus/ui/components/instance-navigation"
import { cn } from "@janus/ui/lib/utils"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleDashed,
  Clock3,
  CloudCog,
  Code2,
  Cpu,
  Info,
  ListTodo,
  Logs,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react"
import { useEffect, useState } from "react"
import { InstanceDetail } from "./instance-detail"
import type { InstanceDetailTab } from "./instance-detail-tabs"
import {
  healthQueryOptions,
  instancesQueryOptions,
  systemQueryOptions,
  tasksQueryOptions,
} from "./queries"

export interface DashboardProps {
  api: JanusApiClient
  platform: "web" | "electron"
  activeView: DashboardView
  onNavigate: (view: DashboardView) => void
}

export type DashboardView =
  | { kind: "dashboard" }
  | { kind: "instance"; instance: string; tab: InstanceDetailTab }

const instanceTabs = [
  { id: "overview", label: "概览", icon: Info },
  { id: "tasks", label: "任务", icon: ListTodo },
  { id: "config", label: "配置", icon: Settings2 },
  { id: "logs", label: "日志", icon: Logs },
] as const

const taskGroups = [
  { key: "running", label: "运行中", icon: Activity, tone: "text-emerald-700" },
  { key: "pending", label: "待执行", icon: Clock3, tone: "text-blue-700" },
  { key: "waiting", label: "等待中", icon: CircleDashed, tone: "text-amber-700" },
] as const

export function Dashboard({ api, platform, activeView, onNavigate }: DashboardProps) {
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const routedInstance = activeView.kind === "instance" ? activeView.instance : null
  const [expandedInstance, setExpandedInstance] = useState<string | null>(() => routedInstance)
  const health = useQuery(healthQueryOptions(api))
  const system = useQuery(systemQueryOptions(api))
  const instances = useQuery(instancesQueryOptions(api))
  const instanceItems = instances.data?.items ?? []
  const activeInstance = routedInstance ?? selectedInstance ?? instanceItems[0]?.name ?? ""
  const tasks = useQuery({
    ...tasksQueryOptions(api, activeInstance),
    enabled: Boolean(activeInstance),
  })

  const online = health.data?.status === "ok"
  const runningInstances = instanceItems.filter((instance) => instance.running).length
  const fetching =
    health.isFetching || system.isFetching || instances.isFetching || tasks.isFetching

  useEffect(() => {
    if (!routedInstance) {
      return
    }

    setExpandedInstance((current) => (current === routedInstance ? current : routedInstance))
  }, [routedInstance])

  async function refreshDashboard() {
    await Promise.all([
      health.refetch(),
      system.refetch(),
      instances.refetch(),
      activeInstance ? tasks.refetch() : Promise.resolve(),
    ])
  }

  function showInstance(instance: string, tab: InstanceDetailTab = "overview") {
    setSelectedInstance(instance)
    setExpandedInstance(instance)
    onNavigate({ kind: "instance", instance, tab })
  }

  function toggleInstance(instance: string) {
    if (expandedInstance === instance) {
      setExpandedInstance(null)
      return
    }

    setExpandedInstance(instance)
    if (activeView.kind === "instance" && activeView.instance === instance) {
      return
    }

    showInstance(instance)
  }

  return (
    <div className="app-viewport overflow-hidden p-3 text-slate-950 sm:p-5 lg:p-6">
      <div className="mx-auto grid h-full max-w-385 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-4xl border border-white/70 bg-white/48 shadow-[0_28px_80px_-34px_rgba(30,64,83,0.45)] backdrop-blur-[34px] lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:grid-rows-1 lg:rounded-[2.25rem]">
        <aside className="flex min-h-0 shrink-0 flex-col overflow-hidden border-white/65 border-b bg-white/36 p-3 sm:p-4 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-4 lg:flex lg:grid-cols-none lg:items-stretch lg:gap-0 lg:border-r lg:border-b-0 lg:p-5">
          <div className="flex items-center justify-between gap-4 lg:justify-start">
            <div className="flex size-11 items-center justify-center rounded-[0.9rem] bg-slate-950 text-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.75)]">
              <span className="font-semibold text-lg tracking-[-0.03em]">J</span>
            </div>
            <div className="min-w-0 lg:flex-1">
              <p className="font-semibold text-[1.05rem] tracking-[-0.02em]">Janus</p>
              <p className="text-slate-500 text-xs">AzurPilot 控制台</p>
            </div>
            <ConnectionBadge className="lg:hidden" online={online} pending={health.isPending} />
          </div>

          <InstanceNavigation
            instances={instanceItems}
            tabs={instanceTabs}
            dashboardActive={activeView.kind === "dashboard"}
            activeInstance={activeView.kind === "instance" ? activeView.instance : undefined}
            activeTab={activeView.kind === "instance" ? activeView.tab : undefined}
            expandedInstance={expandedInstance ?? undefined}
            pendingContent={instances.isPending ? <InstanceNavigationSkeleton /> : null}
            footer={
              <div className="flex items-center justify-between rounded-2xl bg-white/45 px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 text-slate-500" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-slate-700 text-xs">受保护连接</p>
                    <p className="text-[0.68rem] text-slate-400">{platform}</p>
                  </div>
                </div>
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              </div>
            }
            onSelectDashboard={() => onNavigate({ kind: "dashboard" })}
            onSelectInstance={toggleInstance}
            onSelectTab={(instance, tab) => {
              const selectedTab = instanceTabs.find((item) => item.id === tab)?.id
              if (selectedTab) {
                showInstance(instance, selectedTab)
              }
            }}
          />
        </aside>

        {activeView.kind === "dashboard" ? (
          <main
            className="min-h-0 min-w-0 overflow-y-auto overscroll-contain bg-[rgba(248,251,252,0.34)] p-4 sm:p-6 lg:p-8 xl:p-10"
            id="overview"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-semibold text-[1.65rem] tracking-[-0.035em] sm:text-[2rem]">
                  运行概览
                </h1>
                <p className="mt-1 text-slate-500 text-sm">远程查看服务、实例与任务状态。</p>
              </div>
              <div className="flex items-center gap-2">
                <ConnectionBadge
                  className="hidden sm:flex"
                  online={online}
                  pending={health.isPending}
                />
                <Button
                  className="size-11 rounded-full border-white/80 bg-white/58 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.7)] backdrop-blur-xl hover:bg-white/80"
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label="刷新仪表盘"
                  disabled={fetching}
                  onClick={() => void refreshDashboard()}
                >
                  <RefreshCw className={cn("size-4", fetching && "animate-spin")} />
                </Button>
              </div>
            </header>

            {health.isError ? (
              <div
                className="mt-6 flex items-start gap-3 rounded-[1.25rem] bg-red-50/80 px-4 py-3.5 text-red-900 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.12)]"
                role="alert"
              >
                <CircleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium text-sm">无法连接 AzurPilot API</p>
                  <p className="mt-0.5 text-red-800/75 text-xs leading-5">
                    {health.error instanceof Error
                      ? health.error.message
                      : "请检查代理或服务状态。"}
                  </p>
                </div>
              </div>
            ) : null}

            <section className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(130deg,rgba(22,99,140,0.98),rgba(18,61,88,0.96))] p-5 text-white shadow-[0_24px_54px_-32px_rgba(12,61,88,0.8)] sm:p-7 lg:p-8">
              <div
                className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-cyan-300/20 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.6fr)] xl:items-end">
                <div>
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
                    <span>{online ? "AzurPilot 服务在线" : "正在确认服务状态"}</span>
                  </div>
                  <h2 className="mt-5 max-w-xl text-balance font-semibold text-[1.75rem] leading-[1.15] tracking-[-0.035em] sm:text-[2.35rem]">
                    {instanceItems.length > 0
                      ? `${runningInstances} 个实例正在运行`
                      : instances.isPending
                        ? "正在读取实例"
                        : "等待实例接入"}
                  </h2>
                  <p className="wrap-break-word mt-3 max-w-lg text-blue-100/80 text-sm leading-6">
                    {activeInstance
                      ? `当前查看 ${activeInstance}，任务状态每 3 秒自动更新。`
                      : "API 已连接后，实例与任务会在这里自动出现。"}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.15rem] bg-white/15 backdrop-blur-xl">
                  <HeroFact label="API 版本" value={health.data?.apiVersion ?? "—"} />
                  <HeroFact
                    label="实例总数"
                    value={instances.isPending ? "—" : String(instanceItems.length)}
                  />
                </dl>
              </div>
            </section>

            <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
              <section
                className="overflow-hidden rounded-[1.75rem] bg-white/58 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl"
                id="instances"
              >
                <div className="flex flex-col gap-4 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-[1.05rem] tracking-[-0.02em]">当前任务</h2>
                    <p
                      className="mt-1 truncate text-slate-500 text-xs"
                      title={activeInstance ? `${activeInstance} · 自动刷新` : undefined}
                    >
                      {activeInstance ? `${activeInstance} · 自动刷新` : "选择一个实例查看任务"}
                    </p>
                  </div>
                  <div className="flex max-w-full flex-wrap items-center gap-2 self-start sm:justify-end">
                    {instanceItems.length > 0 ? (
                      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[0.95rem] bg-slate-900/4.5 p-1">
                        {instanceItems.map((instance) => (
                          <button
                            key={instance.name}
                            className={cn(
                              "flex min-h-11 max-w-44 shrink-0 items-center rounded-[0.72rem] px-3 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                              instance.name === activeInstance
                                ? "bg-white text-slate-950 shadow-[0_5px_14px_-10px_rgba(15,23,42,0.7)]"
                                : "text-slate-500 hover:text-slate-950",
                            )}
                            type="button"
                            title={instance.name}
                            onClick={() => setSelectedInstance(instance.name)}
                          >
                            <span className="min-w-0 truncate">{instance.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="border-slate-900/6 border-t xl:max-h-128 xl:overflow-y-auto xl:overscroll-contain">
                  {tasks.isPending && activeInstance ? <TaskListSkeleton /> : null}
                  {tasks.isError ? (
                    <EmptyState
                      icon={CircleAlert}
                      title="任务读取失败"
                      detail={tasks.error instanceof Error ? tasks.error.message : "稍后刷新重试。"}
                    />
                  ) : null}
                  {!activeInstance && !instances.isPending ? (
                    <EmptyState
                      icon={Server}
                      title="还没有可用实例"
                      detail="请先在 AzurPilot 中创建并启动实例。"
                    />
                  ) : null}
                  {tasks.data ? <TaskList tasks={tasks.data} /> : null}
                </div>
              </section>

              <section className="rounded-[1.75rem] bg-white/58 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-[1.05rem] tracking-[-0.02em]">运行环境</h2>
                    <p className="mt-1 text-slate-500 text-xs">来自当前 AzurPilot 核心</p>
                  </div>
                  <CloudCog className="size-5 text-slate-400" aria-hidden="true" />
                </div>

                {system.isPending ? <SystemFactsSkeleton /> : null}
                {system.isError ? (
                  <p className="mt-6 text-red-700 text-sm" role="alert">
                    系统信息读取失败。
                  </p>
                ) : null}
                {system.data ? (
                  <dl className="mt-5 divide-y divide-slate-900/6">
                    <SystemFact
                      icon={Code2}
                      label="核心提交"
                      value={shortCommit(system.data.coreCommit)}
                      mono
                    />
                    <SystemFact icon={Cpu} label="Python" value={system.data.pythonVersion} />
                    <SystemFact icon={Server} label="平台" value={system.data.platform} />
                    <SystemFact
                      icon={ListTodo}
                      label="API 能力"
                      value={`${system.data.capabilities.length} 项`}
                    />
                  </dl>
                ) : null}
              </section>
            </div>
          </main>
        ) : (
          <InstanceDetail
            key={activeView.instance}
            api={api}
            instance={activeView.instance}
            activeTab={activeView.tab}
          />
        )}
      </div>
    </div>
  )
}

function ConnectionBadge({
  online,
  pending,
  className,
}: {
  online: boolean
  pending: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-full bg-white/55 px-3 font-medium text-slate-600 text-xs shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] backdrop-blur-xl",
        className,
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          "size-2 rounded-full",
          pending ? "animate-pulse bg-amber-400" : online ? "bg-emerald-500" : "bg-red-500",
        )}
        aria-hidden="true"
      />
      {pending ? "连接中" : online ? "服务在线" : "服务离线"}
    </div>
  )
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/8 px-4 py-4 first:border-white/15 first:border-r sm:px-5">
      <dt className="text-blue-100/70 text-xs">{label}</dt>
      <dd
        className="mt-1.5 truncate font-semibold text-lg tabular-nums tracking-tight"
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}

function TaskList({ tasks }: { tasks: TaskListResponse }) {
  const [expandedGroup, setExpandedGroup] = useState<(typeof taskGroups)[number]["key"] | null>(
    null,
  )
  const visibleGroups = taskGroups.filter((group) => tasks[group.key].length > 0)

  if (visibleGroups.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="当前没有活动任务"
        detail="任务队列为空；新的调度任务出现后会自动显示。"
      />
    )
  }

  return (
    <div className="divide-y divide-slate-900/6">
      {visibleGroups.map((group) => (
        <div key={group.key} className="px-5 py-4 sm:px-6">
          <div className="mb-3 flex items-center gap-2">
            <group.icon className={cn("size-4", group.tone)} aria-hidden="true" />
            <h3 className="font-medium text-slate-600 text-xs">{group.label}</h3>
            <span className="text-slate-500 text-xs tabular-nums">{tasks[group.key].length}</span>
          </div>
          <div className="space-y-1">
            {(expandedGroup === group.key ? tasks[group.key] : tasks[group.key].slice(0, 4)).map(
              (task) => (
                <TaskRow key={task.name} task={task} />
              ),
            )}
          </div>
          {tasks[group.key].length > 4 ? (
            <button
              className="mt-2 flex min-h-11 items-center gap-1.5 rounded-[0.8rem] px-2.5 font-medium text-blue-700 text-xs transition-colors hover:bg-blue-50/70 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
              type="button"
              aria-expanded={expandedGroup === group.key}
              onClick={() =>
                setExpandedGroup((current) => (current === group.key ? null : group.key))
              }
            >
              {expandedGroup === group.key ? (
                <>
                  收起
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </>
              ) : (
                <>
                  显示 4 / {tasks[group.key].length} · 查看全部
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function TaskRow({ task }: { task: TaskResponse }) {
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-[0.9rem] px-2.5 transition-colors hover:bg-slate-900/[0.035]">
      <span
        className={cn("size-2 rounded-full", task.enabled ? "bg-blue-500" : "bg-slate-300")}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{task.displayName || task.name}</p>
        <p className="mt-0.5 truncate text-slate-500 text-xs">{localizeTaskState(task.state)}</p>
      </div>
      <DateDisplay className="shrink-0 text-slate-500 text-xs tabular-nums" value={task.nextRun} />
    </div>
  )
}

function SystemFact({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof Code2
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 py-2.5">
      <Icon className="size-4 text-slate-400" aria-hidden="true" />
      <dt className="flex-1 text-slate-500 text-sm">{label}</dt>
      <dd className={cn("max-w-[55%] truncate font-medium text-sm", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Server
  title: string
  detail: string
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <Icon className="size-6 text-slate-300" aria-hidden="true" />
      <h3 className="mt-4 max-w-full truncate font-medium text-sm" title={title}>
        {title}
      </h3>
      <p className="wrap-break-word mt-1.5 max-w-sm text-slate-500 text-xs leading-5">{detail}</p>
    </div>
  )
}

function InstanceNavigationSkeleton() {
  return (
    <div className="space-y-2 px-3.5 py-2" aria-hidden="true">
      <div className="h-3 w-28 animate-pulse rounded-full bg-slate-900/8" />
      <div className="h-3 w-20 animate-pulse rounded-full bg-slate-900/6" />
    </div>
  )
}

function TaskListSkeleton() {
  const rows = ["task-skeleton-one", "task-skeleton-two", "task-skeleton-three"]

  return (
    <div className="space-y-4 px-5 py-6 sm:px-6" role="status" aria-label="正在加载任务">
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-3">
          <div className="size-2 animate-pulse rounded-full bg-slate-900/10" />
          <div className="h-3 flex-1 animate-pulse rounded-full bg-slate-900/8" />
          <div className="h-3 w-16 animate-pulse rounded-full bg-slate-900/6" />
        </div>
      ))}
    </div>
  )
}

function SystemFactsSkeleton() {
  const rows = [
    "system-skeleton-commit",
    "system-skeleton-python",
    "system-skeleton-platform",
    "system-skeleton-capabilities",
  ]

  return (
    <div className="mt-5 space-y-4" role="status" aria-label="正在加载系统信息">
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-3 py-2">
          <div className="size-4 animate-pulse rounded bg-slate-900/7" />
          <div className="h-3 flex-1 animate-pulse rounded-full bg-slate-900/7" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-slate-900/5" />
        </div>
      ))}
    </div>
  )
}

function shortCommit(value: string) {
  return value.length > 12 ? value.slice(0, 12) : value || "—"
}

function localizeTaskState(value: string) {
  const labels: Record<string, string> = {
    disabled: "已停用",
    pending: "待执行",
    running: "运行中",
    waiting: "等待中",
  }

  return labels[value.toLowerCase()] ?? value
}
