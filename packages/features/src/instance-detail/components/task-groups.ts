import { Activity, CircleDashed, Clock3 } from "lucide-react"

export const taskGroups = [
  { key: "running", label: "运行中", icon: Activity, tone: "text-emerald-700" },
  { key: "pending", label: "待执行", icon: Clock3, tone: "text-blue-700" },
  { key: "waiting", label: "等待中", icon: CircleDashed, tone: "text-amber-700" },
  { key: "disabled", label: "已停用", icon: CircleDashed, tone: "text-slate-400" },
] as const
