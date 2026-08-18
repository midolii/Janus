import type { TaskListResponse, TaskResponse } from "@janus/api-client/contracts"
import { DateDisplay } from "@janus/ui/components/date-display"
import { cn } from "@janus/ui/lib/utils"
import { Activity, CircleDashed, Clock3, SquareTerminal, Wifi, WifiOff } from "lucide-react"
import {
  OverviewHeroSkeleton,
  TaskSummarySkeleton,
  TasksContentSkeleton,
} from "./instance-detail-skeletons"
import { ErrorPanel, localizeState, PageHeading } from "./instance-panel-primitives"

const taskGroups = [
  { key: "running", label: "运行中", icon: Activity, tone: "text-emerald-700" },
  { key: "pending", label: "待执行", icon: Clock3, tone: "text-blue-700" },
  { key: "waiting", label: "等待中", icon: CircleDashed, tone: "text-amber-700" },
  { key: "disabled", label: "已停用", icon: CircleDashed, tone: "text-slate-400" },
] as const

export function OverviewPanel({
  instanceData,
  instancePending,
  tasks,
  tasksPending,
}: {
  instanceData?: { name: string; module: string; running: boolean; state: string }
  instancePending: boolean
  tasks?: TaskListResponse
  tasksPending: boolean
}) {
  const activeTasks = (tasks?.running.length ?? 0) + (tasks?.pending.length ?? 0)

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
      <PageHeading title="实例概览" detail="确认运行状态和最近的任务队列。" />
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[1.75rem]">
        {instancePending ? (
          <OverviewHeroSkeleton />
        ) : (
          <section className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(130deg,rgba(22,99,140,0.98),rgba(18,61,88,0.96))] p-5 text-white shadow-[0_24px_54px_-32px_rgba(12,61,88,0.8)] sm:p-7">
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              {instanceData?.running ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
              <span>{instanceData?.running ? "实例正在运行" : "实例当前未运行"}</span>
            </div>
            <h2
              className="mt-5 truncate font-semibold text-3xl tracking-[-0.04em]"
              title={instanceData?.name ?? "未知实例"}
            >
              {instanceData?.name ?? "未知实例"}
            </h2>
            <dl className="mt-7 grid gap-px overflow-hidden rounded-[1.1rem] bg-white/15 sm:grid-cols-3">
              <OverviewFact label="模块" value={instanceData?.module ?? "—"} />
              <OverviewFact label="核心状态" value={localizeState(instanceData?.state)} />
              <OverviewFact label="活动任务" value={String(activeTasks)} />
            </dl>
          </section>
        )}

        <section className="mt-6 rounded-[1.75rem] bg-white/62 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-[1.05rem] tracking-[-0.02em]">队列摘要</h2>
              <p className="mt-1 text-slate-500 text-xs">任务数据每 3 秒自动更新</p>
            </div>
            <SquareTerminal className="size-5 text-slate-400" aria-hidden="true" />
          </div>
          {tasksPending ? <TaskSummarySkeleton /> : null}
          {tasks ? <TaskSummary tasks={tasks} /> : null}
        </section>
      </div>
    </div>
  )
}

function OverviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/8 px-4 py-4 sm:px-5">
      <dt className="text-blue-100/75 text-xs">{label}</dt>
      <dd className="mt-1.5 truncate font-semibold text-lg tracking-tight">{value}</dd>
    </div>
  )
}

function TaskSummary({ tasks }: { tasks: TaskListResponse }) {
  return (
    <dl className="mt-5 grid gap-3 sm:grid-cols-3">
      {taskGroups.slice(0, 3).map((group) => (
        <div key={group.key} className="rounded-2xl bg-slate-900/[0.035] px-4 py-3.5">
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

export function TasksPanel({
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
          {pending ? <TasksContentSkeleton /> : null}
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
