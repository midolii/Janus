import type { InstanceResponse } from "@janus/api-client/contracts"
import { InstanceNavigation } from "@janus/ui/components/instance-navigation"
import { Info, ListTodo, Logs, Settings2, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import type { InstanceDetailTab } from "../../instance-detail/instance-detail-tabs"
import { ConnectionBadge } from "./dashboard-content"

const instanceTabs = [
  { id: "overview", label: "概览", icon: Info },
  { id: "tasks", label: "任务", icon: ListTodo },
  { id: "config", label: "配置", icon: Settings2 },
  { id: "logs", label: "日志", icon: Logs },
] as const

interface DashboardSidebarProps {
  instances: readonly InstanceResponse[]
  instancesPending: boolean
  platform: "web" | "electron"
  online: boolean
  healthPending: boolean
  dashboardActive: boolean
  activeInstance?: string
  activeTab?: InstanceDetailTab
  expandedInstance?: string
  pendingContent?: ReactNode
  onSelectDashboard: () => void
  onSelectInstance: (instance: string) => void
  onSelectTab: (instance: string, tab: InstanceDetailTab) => void
}

export function DashboardSidebar({
  instances,
  instancesPending,
  platform,
  online,
  healthPending,
  dashboardActive,
  activeInstance,
  activeTab,
  expandedInstance,
  pendingContent,
  onSelectDashboard,
  onSelectInstance,
  onSelectTab,
}: DashboardSidebarProps) {
  return (
    <aside className="flex min-h-0 shrink-0 flex-col overflow-hidden border-white/65 border-b bg-white/36 p-3 sm:p-4 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-4 lg:flex lg:grid-cols-none lg:items-stretch lg:gap-0 lg:border-r lg:border-b-0 lg:p-5">
      <div className="flex items-center justify-between gap-4 lg:justify-start">
        <img
          src="/icons/icon-192.png"
          srcSet="/icons/icon-48.png 1x, /icons/icon-192.png 2x, /icons/icon-512.png 3x"
          alt="Janus"
          className="size-11 rounded-[0.9rem] shadow-[0_10px_24px_-14px_rgba(15,23,42,0.75)]"
        />
        <div className="min-w-0 lg:flex-1">
          <p className="font-semibold text-[1.05rem] tracking-[-0.02em]">Janus</p>
          <p className="text-slate-500 text-xs">AzurPilot 控制台</p>
        </div>
        <ConnectionBadge className="lg:hidden" online={online} pending={healthPending} />
      </div>

      <InstanceNavigation
        instances={instances}
        tabs={instanceTabs}
        dashboardActive={dashboardActive}
        activeInstance={activeInstance}
        activeTab={activeTab}
        expandedInstance={expandedInstance}
        pendingContent={instancesPending ? pendingContent : null}
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
        onSelectDashboard={onSelectDashboard}
        onSelectInstance={onSelectInstance}
        onSelectTab={(instance, tab) => {
          const selectedTab = instanceTabs.find((item) => item.id === tab)?.id
          if (selectedTab) {
            onSelectTab(instance, selectedTab)
          }
        }}
      />
    </aside>
  )
}
