import type { TaskListResponse, TaskResponse } from "@janus/api-client/contracts"
import { DateDisplay } from "@janus/ui/components/date-display"
import { cn } from "@janus/ui/lib/utils"
import { CheckCircle2, SquareTerminal, Wifi, WifiOff } from "lucide-react"
import { OverviewHeroSkeleton, TaskSummarySkeleton } from "./instance-detail-skeletons"
import { localizeState, PageHeading } from "./instance-panel-primitives"
import { taskGroups } from "./task-groups"

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
  const running = instanceData?.running ?? false

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
      <PageHeading title="实例概览" detail="确认运行状态和最近的任务队列。" />
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-1">
        {instancePending ? (
          <OverviewHeroSkeleton />
        ) : (
          <section className="rounded-[1.75rem] bg-[#174c68] p-5 text-white ring-1 ring-white/20 sm:p-7">
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              {running ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
              <span>{running ? "实例正在运行" : "实例当前未运行"}</span>
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

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)]">
          <section className="rounded-[1.75rem] bg-white/68 p-5 ring-1 ring-slate-900/6 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-[1.05rem] tracking-[-0.02em]">近期任务</h2>
                <p className="mt-1 text-slate-500 text-xs">按队列顺序从上到下显示</p>
              </div>
              <SquareTerminal className="size-5 text-slate-400" aria-hidden="true" />
            </div>
            {tasksPending ? <TaskQueueSkeleton /> : null}
            {tasks ? <TaskQueue tasks={tasks} /> : null}
          </section>

          <section className="rounded-[1.75rem] bg-white/68 p-5 ring-1 ring-slate-900/6 sm:p-6">
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
    </div>
  )
}

function OverviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/8 px-4 py-4 sm:px-5">
      <dt className="text-blue-100/75 text-xs">{label}</dt>
      <dd className="mt-1.5 truncate font-semibold text-lg tracking-tight" title={value}>
        {value}
      </dd>
    </div>
  )
}

function TaskQueue({ tasks }: { tasks: TaskListResponse }) {
  const queue = taskGroups.flatMap((group) => tasks[group.key].map((task) => ({ group, task })))
  if (queue.length === 0) {
    return (
      <div className="mt-5 flex min-h-28 flex-col items-center justify-center text-center">
        <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
        <p className="mt-2 text-slate-500 text-sm">当前队列为空</p>
      </div>
    )
  }

  return (
    <ol className="mt-5 space-y-2">
      {queue.slice(0, 6).map(({ group, task }, index) => (
        <TaskQueueRow key={`${group.key}:${task.name}`} index={index + 1} task={task} />
      ))}
    </ol>
  )
}

function TaskQueueRow({ index, task }: { index: number; task: TaskResponse }) {
  return (
    <li className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-900/7 px-3 py-2.5">
      <span className="text-center text-slate-400 text-xs tabular-nums">{index}</span>
      <div className="min-w-0">
        <p className="truncate font-medium text-sm" title={task.displayName || task.name}>
          {task.displayName || task.name}
        </p>
        <p className="mt-0.5 text-slate-500 text-xs">{localizeState(task.state)}</p>
      </div>
      <DateDisplay className="text-slate-500 text-xs tabular-nums" value={task.nextRun} />
    </li>
  )
}

function TaskSummary({ tasks }: { tasks: TaskListResponse }) {
  return (
    <dl className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
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

function TaskQueueSkeleton() {
  const rows = ["first", "second", "third", "fourth"]
  return (
    <div className="mt-5 space-y-2" aria-hidden="true">
      {rows.map((row) => (
        <div
          key={row}
          className="h-14 animate-pulse rounded-2xl border border-slate-900/6 bg-slate-900/4"
        />
      ))}
    </div>
  )
}
