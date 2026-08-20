import type { TaskListResponse, TaskResponse } from "@janus/api-client/contracts"
import { Button } from "@janus/ui/components/button"
import { DateDisplay } from "@janus/ui/components/date-display"
import { cn } from "@janus/ui/lib/utils"
import { LoaderCircle, Play } from "lucide-react"
import { TasksContentSkeleton } from "./instance-detail-skeletons"
import { ErrorPanel, localizeState, PageHeading } from "./instance-panel-primitives"
import { taskGroups } from "./task-groups"

export function TasksPanel({
  data,
  pending,
  error,
  runningTaskName,
  actionError,
  onRunNow,
}: {
  data?: TaskListResponse
  pending: boolean
  error: Error | null
  runningTaskName: string | null
  actionError: Error | null
  onRunNow: (task: string) => void
}) {
  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
      <div className="flex shrink-0 items-end justify-between gap-4">
        <PageHeading title="任务队列" detail="按状态分组，并在每组内从上到下查看。" />
        {data && data.disabled.length > 0 ? (
          <p className="hidden shrink-0 text-slate-400 text-xs sm:block">
            已停用 {data.disabled.length} 项，可在配置中启用
          </p>
        ) : null}
      </div>
      <section className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain xl:overflow-hidden">
        <div className="min-h-full xl:h-full">
          {pending ? <TasksContentSkeleton /> : null}
          {error ? <ErrorPanel title="任务读取失败" detail={error.message} compact /> : null}
          {actionError ? (
            <ErrorPanel title="任务操作失败" detail={actionError.message} compact />
          ) : null}
          {data ? (
            <div className="grid min-h-full gap-4 xl:h-full xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="contents xl:grid xl:min-h-0 xl:grid-rows-[minmax(12rem,0.4fr)_minmax(16rem,0.6fr)] xl:gap-4">
                <TaskQueueColumn
                  group={taskGroups[0]}
                  tasks={data.running}
                  runningTaskName={runningTaskName}
                  showRunNow={false}
                  onRunNow={onRunNow}
                />
                <TaskQueueColumn
                  group={taskGroups[1]}
                  tasks={data.pending}
                  runningTaskName={runningTaskName}
                  showRunNow
                  onRunNow={onRunNow}
                />
              </div>
              <TaskQueueColumn
                group={taskGroups[2]}
                tasks={data.waiting}
                runningTaskName={runningTaskName}
                showRunNow
                onRunNow={onRunNow}
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function TaskQueueColumn({
  group,
  tasks,
  runningTaskName,
  showRunNow,
  onRunNow,
}: {
  group: (typeof taskGroups)[number]
  tasks: TaskResponse[]
  runningTaskName: string | null
  showRunNow: boolean
  onRunNow: (task: string) => void
}) {
  return (
    <section className="flex min-h-64 min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-slate-900/8 bg-white/68 xl:min-h-0">
      <header className="flex shrink-0 items-center gap-2 border-slate-900/6 border-b px-5 py-4">
        <group.icon className={cn("size-4", group.tone)} aria-hidden="true" />
        <h2 className="font-medium text-slate-700 text-sm">{group.label}</h2>
        <span className="text-slate-500 text-xs tabular-nums">{tasks.length}</span>
      </header>
      {tasks.length > 0 ? (
        <ol className="min-h-0 flex-1 space-y-2 px-3 py-3 xl:overflow-y-auto xl:overscroll-contain">
          {tasks.map((task, index) => (
            <TaskRow
              key={task.name}
              sequence={index + 1}
              task={task}
              actionPending={runningTaskName === task.name}
              showRunNow={showRunNow}
              onRunNow={() => onRunNow(task.name)}
            />
          ))}
        </ol>
      ) : (
        <p className="flex min-h-28 flex-1 items-center justify-center px-4 text-slate-400 text-xs">
          此分组暂无任务
        </p>
      )}
    </section>
  )
}

function TaskRow({
  sequence,
  task,
  actionPending,
  showRunNow,
  onRunNow,
}: {
  sequence: number
  task: TaskResponse
  actionPending: boolean
  showRunNow: boolean
  onRunNow: () => void
}) {
  const canRunNow = task.enabled && task.state.toLowerCase() !== "running"
  return (
    <li className="flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border border-slate-900/8 bg-white/42 px-3 transition-colors hover:border-slate-900/12 hover:bg-white/72">
      <span className="w-5 shrink-0 text-center text-slate-400 text-xs tabular-nums">
        {sequence}
      </span>
      <span
        className={cn("size-2 rounded-full", task.enabled ? "bg-blue-500" : "bg-slate-300")}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{task.displayName || task.name}</p>
        <p className="mt-0.5 truncate text-slate-500 text-xs">{localizeState(task.state)}</p>
      </div>
      <DateDisplay
        className="hidden shrink-0 text-slate-500 text-xs tabular-nums sm:block xl:hidden 2xl:block"
        value={task.nextRun}
      />
      {showRunNow ? (
        <Button
          className="h-9 shrink-0 px-3"
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canRunNow || actionPending}
          title={canRunNow ? "将任务调度时间调整为现在" : "当前任务不可立即执行"}
          onClick={onRunNow}
        >
          {actionPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}
          <span className="hidden sm:inline">立即执行</span>
        </Button>
      ) : null}
    </li>
  )
}
