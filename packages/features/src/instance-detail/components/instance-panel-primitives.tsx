import { cn } from "@janus/ui/lib/utils"
import { CheckCircle2, CircleAlert } from "lucide-react"

export function PageHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="min-w-0 shrink-0">
      <h2
        className="truncate font-semibold text-2xl tracking-[-0.035em] sm:text-[1.75rem]"
        title={title}
      >
        {title}
      </h2>
      <p className="wrap-break-word mt-1 text-slate-500 text-sm">{detail}</p>
    </div>
  )
}

export function EmptyPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <CheckCircle2 className="size-6 text-slate-300" aria-hidden="true" />
      <h2 className="mt-4 max-w-full truncate font-medium text-sm" title={title}>
        {title}
      </h2>
      <p className="wrap-break-word mt-1.5 max-w-sm text-slate-500 text-xs leading-5">{detail}</p>
    </div>
  )
}

export function ErrorPanel({
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
        <p className="wrap-break-word mt-0.5 text-red-800/75 text-xs leading-5">{detail}</p>
      </div>
    </div>
  )
}

export function localizeState(value?: string) {
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
