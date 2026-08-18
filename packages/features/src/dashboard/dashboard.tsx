import type { JanusApiClient } from "@janus/api-client/client"
import type { LiveScreenshotRuntime } from "@janus/api-client/live-screenshot"
import { Button } from "@janus/ui/components/button"
import { cn } from "@janus/ui/lib/utils"
import { useQuery } from "@tanstack/react-query"
import {
  CircleAlert,
  CloudCog,
  Code2,
  Cpu,
  ListTodo,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  healthQueryOptions,
  instancesQueryOptions,
  systemQueryOptions,
  tasksQueryOptions,
} from "../api/queries"
import { InstanceDetail } from "../instance-detail/instance-detail"
import type { InstanceDetailTab } from "../instance-detail/instance-detail-tabs"
import { LiveScreenshotOverlay } from "../live-screenshot/live-screenshot-overlay"
import {
  ConnectionBadge,
  EmptyState,
  HeroFact,
  InstanceNavigationSkeleton,
  SystemFact,
  SystemFactsSkeleton,
  shortCommit,
  TaskList,
  TaskListSkeleton,
} from "./components/dashboard-content"
import { DashboardSidebar } from "./components/dashboard-sidebar"

export interface DashboardProps {
  api: JanusApiClient
  liveScreenshot: LiveScreenshotRuntime
  platform: "web" | "electron"
  activeView: DashboardView
  expandedInstance: string | null
  onExpandedInstanceChange: (instance: string | null) => void
  onNavigate: (view: DashboardView) => void
}

export type DashboardView =
  | { kind: "dashboard" }
  | { kind: "instance"; instance: string; tab: InstanceDetailTab }

export function Dashboard({
  api,
  liveScreenshot,
  platform,
  activeView,
  expandedInstance,
  onExpandedInstanceChange,
  onNavigate,
}: DashboardProps) {
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const routedInstance = activeView.kind === "instance" ? activeView.instance : null
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

    // Route changes should reveal their instance once. The disclosure state deliberately is not
    // a dependency: otherwise manually collapsing the active instance immediately reopens it.
    onExpandedInstanceChange(routedInstance)
  }, [onExpandedInstanceChange, routedInstance])

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
    onExpandedInstanceChange(instance)
    onNavigate({ kind: "instance", instance, tab })
  }

  function toggleInstance(instance: string) {
    if (expandedInstance === instance) {
      onExpandedInstanceChange(null)
      return
    }

    onExpandedInstanceChange(instance)
    if (activeView.kind === "instance" && activeView.instance === instance) {
      return
    }

    showInstance(instance)
  }

  return (
    <div className="app-viewport overflow-hidden p-3 text-slate-950 sm:p-5 lg:p-6">
      <div className="mx-auto grid h-full max-w-385 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-4xl border border-white/70 bg-white/48 shadow-[0_28px_80px_-34px_rgba(30,64,83,0.45)] backdrop-blur-[34px] lg:grid-cols-[15rem_minmax(0,1fr)] lg:grid-rows-1 lg:rounded-[2.25rem]">
        <DashboardSidebar
          instances={instanceItems}
          instancesPending={instances.isPending}
          platform={platform}
          online={online}
          healthPending={health.isPending}
          dashboardActive={activeView.kind === "dashboard"}
          activeInstance={activeView.kind === "instance" ? activeView.instance : undefined}
          activeTab={activeView.kind === "instance" ? activeView.tab : undefined}
          expandedInstance={expandedInstance ?? undefined}
          pendingContent={<InstanceNavigationSkeleton />}
          onSelectDashboard={() => onNavigate({ kind: "dashboard" })}
          onSelectInstance={toggleInstance}
          onSelectTab={showInstance}
        />

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
                      <div className="scrollbar-hidden flex w-fit max-w-full gap-1 overflow-x-auto rounded-[0.95rem] bg-slate-900/4.5 p-1">
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
      <LiveScreenshotOverlay
        api={api}
        runtime={liveScreenshot}
        instances={instanceItems}
        preferredInstance={activeInstance || undefined}
      />
    </div>
  )
}
