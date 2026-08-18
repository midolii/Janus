import type { TaskListResponse, TaskResponse } from "@janus/api-client/contracts"
import { DateDisplay } from "@janus/ui/components/date-display"
import { cn } from "@janus/ui/lib/utils"
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock3,
  type Code2,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

const taskGroups = [
  { key: "running", label: "运行中", icon: Activity, tone: "text-emerald-700" },
  { key: "pending", label: "待执行", icon: Clock3, tone: "text-blue-700" },
  { key: "waiting", label: "等待中", icon: CircleDashed, tone: "text-amber-700" },
] as const

export function ConnectionBadge({
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

export function HeroFact({ label, value }: { label: string; value: string }) {
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

export function TaskList({ tasks }: { tasks: TaskListResponse }) {
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

export function SystemFact({
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

export function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon
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

export function InstanceNavigationSkeleton() {
  return (
    <div className="space-y-2 px-3.5 py-2" aria-hidden="true">
      <div className="h-3 w-28 animate-pulse rounded-full bg-slate-900/8" />
      <div className="h-3 w-20 animate-pulse rounded-full bg-slate-900/6" />
    </div>
  )
}

export function TaskListSkeleton() {
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

export function SystemFactsSkeleton() {
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

export function shortCommit(value: string) {
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
