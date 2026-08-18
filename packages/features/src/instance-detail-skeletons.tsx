import { cn } from "@janus/ui/lib/utils"

const taskSkeletonGroups = [
  { id: "running", rows: 1 },
  { id: "pending", rows: 2 },
  { id: "waiting", rows: 2 },
  { id: "disabled", rows: 1 },
] as const

const configMenuSkeletons = ["menu-1", "menu-2", "menu-3", "menu-4"] as const
const configSubmenuSkeletons = ["submenu-1", "submenu-2", "submenu-3"] as const
const configGroupSkeletons = ["group-1", "group-2", "group-3", "group-4"] as const
const configFieldSkeletons = [
  { id: "field-1", descriptionLines: 2 },
  { id: "field-2", descriptionLines: 1 },
  { id: "field-3", descriptionLines: 2 },
  { id: "field-4", descriptionLines: 1 },
] as const
const logLineSkeletons = ["line-1", "line-2", "line-3", "line-4", "line-5"] as const

interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      className={cn(
        "block animate-pulse rounded-full bg-slate-900/8 motion-reduce:animate-none",
        className,
      )}
      aria-hidden="true"
    />
  )
}

function LoadingStatus({ label }: { label: string }) {
  return <span className="sr-only">{label}</span>
}

/** Mirrors the overview hero so its height and three-column summary stay stable while loading. */
export function OverviewHeroSkeleton() {
  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(130deg,rgba(22,99,140,0.98),rgba(18,61,88,0.96))] p-5 text-white shadow-[0_24px_54px_-32px_rgba(12,61,88,0.8)] sm:p-7"
      role="status"
      aria-busy="true"
    >
      <LoadingStatus label="正在加载实例概览" />
      <div className="flex min-h-5 items-center gap-2">
        <Skeleton className="size-4 bg-white/20" />
        <Skeleton className="h-3 w-28 bg-white/20" />
      </div>
      <Skeleton className="mt-5 h-9 w-44 max-w-2/3 bg-white/22" />
      <dl className="mt-7 grid gap-px overflow-hidden rounded-[1.1rem] bg-white/15 sm:grid-cols-3">
        {["module", "state", "tasks"].map((item, index) => (
          <div key={item} className="bg-white/8 px-4 py-4 sm:px-5">
            <Skeleton className="h-2.5 w-12 bg-white/18" />
            <Skeleton className={cn("mt-2 h-5 bg-white/24", index === 0 ? "w-24" : "w-16")} />
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Mirrors the three summary cards rendered once task counts are available. */
export function TaskSummarySkeleton() {
  return (
    <div role="status" aria-busy="true">
      <LoadingStatus label="正在加载队列摘要" />
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        {["running", "pending", "waiting"].map((item) => (
          <div key={item} className="rounded-2xl bg-slate-900/[0.035] px-4 py-3.5">
            <div className="flex min-h-4 items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-2.5 w-12" />
            </div>
            <Skeleton className="mt-2.5 h-7 w-8" />
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Matches task group headings and the responsive two-column task rows. */
export function TasksContentSkeleton() {
  return (
    <div className="divide-y divide-slate-900/6" role="status" aria-busy="true">
      <LoadingStatus label="正在加载任务队列" />
      {taskSkeletonGroups.map((group) => (
        <section key={group.id} className="px-5 py-5 sm:px-6">
          <div className="mb-3 flex min-h-4 items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-2.5 w-3" />
          </div>
          <div className="grid gap-1 lg:grid-cols-2">
            {Array.from({ length: group.rows }, (_, index) => `${group.id}-${index}`).map((row) => (
              <div key={row} className="flex min-h-14 items-center gap-3 rounded-[0.95rem] px-3">
                <Skeleton className="size-2 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3 w-2/5 min-w-20" />
                  <Skeleton className="mt-2 h-2.5 w-16" />
                </div>
                <Skeleton className="h-2.5 w-20 shrink-0" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Preserves the desktop sidebar, mobile picker, group tabs, and single-column config fields. */
export function ConfigWorkspaceSkeleton() {
  return (
    <div
      className="mt-4 grid min-h-0 flex-1 gap-3 lg:mt-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:grid-rows-1 lg:gap-5"
      role="status"
      aria-busy="true"
    >
      <LoadingStatus label="正在加载配置" />
      <aside className="hidden min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl bg-white/62 p-3 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl lg:flex">
        <Skeleton className="mx-3 my-2 h-2.5 w-14" />
        <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
          <div className="rounded-[0.85rem] bg-slate-950 px-3 py-3.5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0 bg-white/20" />
              <Skeleton className="h-3 flex-1 bg-white/22" />
              <Skeleton className="size-3 bg-white/18" />
            </div>
          </div>
          <div className="ml-4 space-y-0.5 border-slate-900/8 border-l py-1 pl-2">
            {configSubmenuSkeletons.map((item, index) => (
              <div key={item} className="flex min-h-9 items-center rounded-[0.72rem] px-3">
                <Skeleton className={cn("h-2.5", index === 0 ? "w-24" : "w-16")} />
              </div>
            ))}
          </div>
          {configMenuSkeletons.map((item, index) => (
            <div key={item} className="flex min-h-11 items-center gap-2 rounded-[0.85rem] px-3">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className={cn("h-3", index % 2 === 0 ? "w-28" : "w-20")} />
              <Skeleton className="ml-auto size-3" />
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl bg-white/62 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
        <div className="shrink-0 border-slate-900/6 border-b px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-h-12 items-center gap-3 rounded-[0.95rem] bg-slate-900/[0.035] px-3 lg:hidden">
            <Skeleton className="size-8 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-2 h-3 w-32 max-w-2/3" />
            </div>
            <Skeleton className="size-3 shrink-0" />
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-2 h-5 w-36" />
            <Skeleton className="mt-3 h-2.5 w-4/5" />
          </div>
          <div className="mt-4 flex gap-1 overflow-hidden rounded-[0.95rem] bg-slate-900/[0.035] p-1">
            {configGroupSkeletons.map((group, index) => (
              <Skeleton
                key={group}
                className={cn(
                  "h-10 shrink-0 rounded-[0.72rem]",
                  index === 0 ? "w-24 bg-white" : "w-20",
                )}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-5 py-5 sm:px-6">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="mt-2 h-2.5 w-3/5" />
          <div className="mt-4 space-y-2">
            {configFieldSkeletons.map((field, fieldIndex) => (
              <div key={field.id} className="rounded-2xl bg-slate-900/[0.035] px-4 py-3.5">
                <Skeleton className={cn("h-3", fieldIndex % 2 === 0 ? "w-32" : "w-24")} />
                <div className="mt-2 flex min-h-6 items-center">
                  <Skeleton className={cn("h-3", fieldIndex % 2 === 0 ? "w-28" : "w-16")} />
                </div>
                <div className="mt-2 space-y-2">
                  {Array.from(
                    { length: field.descriptionLines },
                    (_, index) => `${field.id}-description-${index}`,
                  ).map((line, lineIndex) => (
                    <Skeleton
                      key={line}
                      className={cn("h-2.5", lineIndex === 0 ? "w-11/12" : "w-3/5")}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

/** Recreates sticky log block headers and their monospaced rows inside the real log viewport. */
export function LogViewportSkeleton() {
  return (
    <div className="min-w-full divide-y divide-white/8 py-1" role="status" aria-busy="true">
      <LoadingStatus label="正在加载实时日志" />
      {["block-1", "block-2"].map((block, blockIndex) => (
        <div key={block}>
          <div className="flex min-h-12 items-center gap-3 px-4">
            <Skeleton className="size-4 shrink-0 bg-white/8" />
            <Skeleton className="h-2.5 w-20 shrink-0 bg-white/10" />
            <Skeleton className={cn("h-2.5 bg-white/12", blockIndex === 0 ? "w-52" : "w-36")} />
            <Skeleton className="ml-auto h-2.5 w-10 shrink-0 bg-white/8" />
          </div>
          {blockIndex === 0 ? (
            <div className="space-y-2 pb-3 pl-11">
              {logLineSkeletons.map((line, lineIndex) => (
                <Skeleton
                  key={line}
                  className={cn("h-2.5 bg-white/8", lineIndex % 3 === 0 ? "w-4/5" : "w-3/5")}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
