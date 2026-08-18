import { cn } from "@janus/ui/lib/utils"
import { ChevronRight, LayoutDashboard, type LucideIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

export interface InstanceNavigationItem {
  name: string
  running: boolean
}

export interface InstanceNavigationTab {
  id: string
  label: string
  icon: LucideIcon
}

export interface InstanceNavigationProps {
  instances: readonly InstanceNavigationItem[]
  tabs: readonly InstanceNavigationTab[]
  dashboardActive: boolean
  activeInstance?: string
  activeTab?: string
  expandedInstance?: string
  pendingContent?: ReactNode
  footer?: ReactNode
  onSelectDashboard: () => void
  onSelectInstance: (instance: string) => void
  onSelectTab: (instance: string, tab: string) => void
}

export function InstanceNavigation(props: InstanceNavigationProps) {
  return (
    <>
      <MobileInstanceNavigation {...props} />
      <DesktopInstanceNavigation {...props} />
    </>
  )
}

function MobileInstanceNavigation({
  instances,
  tabs,
  dashboardActive,
  activeInstance,
  activeTab,
  onSelectDashboard,
  onSelectInstance,
  onSelectTab,
}: InstanceNavigationProps) {
  return (
    <div className="mt-3 sm:flex sm:min-w-0 sm:items-center sm:gap-2 md:mt-0 lg:hidden">
      <nav
        className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto overscroll-contain px-1 pb-1 sm:flex-1"
        aria-label="主导航"
      >
        <button
          className={cn(
            "flex min-h-10 shrink-0 items-center gap-2 rounded-[0.8rem] px-3 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
            dashboardActive
              ? "bg-slate-950 text-white"
              : "bg-white/35 text-slate-600 hover:bg-white/60 hover:text-slate-950",
          )}
          type="button"
          aria-current={dashboardActive ? "page" : undefined}
          onClick={onSelectDashboard}
        >
          <LayoutDashboard className="size-4" aria-hidden="true" />
          仪表盘
        </button>
        {instances.map((instance) => {
          const active = activeInstance === instance.name
          return (
            <button
              key={instance.name}
              className={cn(
                "flex min-h-10 max-w-44 shrink-0 items-center gap-2 rounded-[0.8rem] px-3 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                active
                  ? "bg-white/80 text-slate-950 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.7)]"
                  : "bg-white/35 text-slate-600 hover:bg-white/60 hover:text-slate-950",
              )}
              type="button"
              aria-label={`实例：${instance.name}`}
              aria-current={active ? "page" : undefined}
              title={instance.name}
              onClick={() => onSelectInstance(instance.name)}
            >
              <InstanceStatus running={instance.running} />
              <span className="min-w-0 truncate">{instance.name}</span>
            </button>
          )
        })}
      </nav>

      {activeInstance ? (
        <div
          className="mt-2 grid auto-cols-fr grid-flow-col gap-1 rounded-[0.9rem] bg-slate-900/[0.045] p-1 sm:mt-0 sm:w-80 sm:shrink-0"
          role="tablist"
          aria-label={`实例：${activeInstance}`}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                className={cn(
                  "flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-[0.7rem] px-1.5 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                  active
                    ? "bg-slate-950 text-white shadow-[0_8px_20px_-16px_rgba(15,23,42,0.85)]"
                    : "text-slate-500 hover:bg-white/45 hover:text-slate-950",
                )}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectTab(activeInstance, tab.id)}
              >
                <tab.icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function DesktopInstanceNavigation({
  instances,
  tabs,
  dashboardActive,
  activeInstance,
  activeTab,
  expandedInstance,
  pendingContent,
  footer,
  onSelectDashboard,
  onSelectInstance,
  onSelectTab,
}: InstanceNavigationProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="hidden min-h-0 flex-1 flex-col lg:flex">
      <nav className="mt-9 block" aria-label="主导航">
        <button
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-[0.9rem] px-3.5 font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
            dashboardActive
              ? "bg-slate-950 text-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.8)]"
              : "text-slate-600 hover:bg-white/55 hover:text-slate-950",
          )}
          type="button"
          aria-current={dashboardActive ? "page" : undefined}
          onClick={onSelectDashboard}
        >
          <LayoutDashboard className="size-4.5" aria-hidden="true" />
          仪表盘
        </button>
      </nav>

      <div className="mt-7 min-h-0 overflow-y-auto overscroll-contain">
        <p className="px-3.5 font-medium text-slate-400 text-xs">实例</p>
        <div className="mt-2 space-y-1">
          {pendingContent}
          {instances.map((instance) => {
            const expanded = expandedInstance === instance.name
            const selected = activeInstance === instance.name
            return (
              <div key={instance.name}>
                <button
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2.5 rounded-[0.9rem] px-3.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                    selected
                      ? "bg-white/70 font-medium text-slate-950 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]"
                      : "text-slate-600 hover:bg-white/45 hover:text-slate-950",
                  )}
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => onSelectInstance(instance.name)}
                >
                  <InstanceStatus running={instance.running} />
                  <span className="min-w-0 flex-1 truncate">实例：{instance.name}</span>
                  <ChevronRight
                    className={cn(
                      "size-3.5 shrink-0 text-slate-400 transition-transform",
                      expanded && "rotate-90",
                    )}
                    aria-hidden="true"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      key="subtabs"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-1 ml-4 space-y-0.5 border-slate-900/8 border-l pl-2"
                        role="tablist"
                        aria-label={`实例：${instance.name}`}
                      >
                        {tabs.map((tab) => {
                          const active = selected && activeTab === tab.id
                          return (
                            <button
                              key={tab.id}
                              className={cn(
                                "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                                active
                                  ? "bg-slate-950 text-white"
                                  : "text-slate-500 hover:bg-white/50 hover:text-slate-950",
                              )}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              onClick={() => onSelectTab(instance.name, tab.id)}
                            >
                              <tab.icon className="size-3.5" aria-hidden="true" />
                              {tab.label}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {footer ? <div className="mt-auto pt-8">{footer}</div> : null}
    </div>
  )
}

function InstanceStatus({ running }: { running: boolean }) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", running ? "bg-emerald-500" : "bg-slate-300")}
      aria-hidden="true"
    />
  )
}
