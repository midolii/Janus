import {
  InstanceNavigation,
  type InstanceNavigationProps,
} from "@janus/ui/components/instance-navigation"
import { Info, ListTodo, Logs, Settings2, ShieldCheck } from "lucide-react"
import { useState } from "react"
import preview from "#.storybook/preview"

const instances = [
  { name: "alas", running: true },
  { name: "港区-备用实例名称很长", running: false },
]

const tabs = [
  { id: "overview", label: "概览", icon: Info },
  { id: "tasks", label: "任务", icon: ListTodo },
  { id: "config", label: "配置", icon: Settings2 },
  { id: "logs", label: "日志", icon: Logs },
]

function InteractiveNavigation(
  props: Pick<
    InstanceNavigationProps,
    "dashboardActive" | "updateActive" | "activeInstance" | "activeTab"
  >,
) {
  const [view, setView] = useState(props)
  const [expandedInstance, setExpandedInstance] = useState(props.activeInstance)

  return (
    <div className="flex h-dvh flex-col bg-[#dce9ef] p-4">
      <div className="flex min-h-0 flex-1 flex-col rounded-4xl border border-white/70 bg-white/48 p-4 backdrop-blur-2xl lg:w-66">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[0.9rem] bg-slate-950 font-semibold text-lg text-white">
            J
          </div>
          <div>
            <p className="font-semibold">Janus</p>
            <p className="text-slate-500 text-xs">AzurPilot 控制台</p>
          </div>
        </div>
        <InstanceNavigation
          instances={instances}
          tabs={tabs}
          dashboardActive={view.dashboardActive}
          updateActive={view.updateActive}
          activeInstance={view.activeInstance}
          activeTab={view.activeTab}
          expandedInstance={expandedInstance}
          footer={
            <div className="flex items-center gap-2 rounded-2xl bg-white/50 px-3 py-3 text-slate-600 text-xs">
              <ShieldCheck className="size-4" />
              受保护连接
            </div>
          }
          onSelectDashboard={() => setView({ dashboardActive: true, updateActive: false })}
          onSelectUpdate={() => setView({ dashboardActive: false, updateActive: true })}
          onToggleInstanceRunning={() => undefined}
          onSelectInstance={(instance) => {
            if (expandedInstance === instance) {
              setExpandedInstance(undefined)
              return
            }

            setExpandedInstance(instance)
            setView({
              dashboardActive: false,
              updateActive: false,
              activeInstance: instance,
              activeTab: "overview",
            })
          }}
          onSelectTab={(instance, tab) => {
            setExpandedInstance(instance)
            setView({
              dashboardActive: false,
              updateActive: false,
              activeInstance: instance,
              activeTab: tab,
            })
          }}
        />
      </div>
    </div>
  )
}

const meta = preview.meta({
  title: "Business/Navigation/InstanceNavigation",
  component: InstanceNavigation,
  args: {
    instances,
    tabs,
    dashboardActive: false,
    updateActive: false,
    onSelectDashboard: () => undefined,
    onSelectUpdate: () => undefined,
    onSelectInstance: () => undefined,
    onSelectTab: () => undefined,
  },
  parameters: {
    layout: "fullscreen",
  },
})

export const Mobile = meta.story({
  globals: {
    viewport: { value: "mobile1", isRotated: false },
  },
  render: () => (
    <InteractiveNavigation
      dashboardActive={false}
      updateActive={false}
      activeInstance="alas"
      activeTab="config"
    />
  ),
})

export const Tablet = meta.story({
  globals: {
    viewport: { value: "tablet", isRotated: false },
  },
  render: () => (
    <InteractiveNavigation
      dashboardActive={false}
      updateActive={false}
      activeInstance="alas"
      activeTab="tasks"
    />
  ),
})

export const Desktop = meta.story({
  render: () => (
    <InteractiveNavigation
      dashboardActive={false}
      updateActive={false}
      activeInstance="alas"
      activeTab="overview"
    />
  ),
})
