import type {
  ConfigMenuResponse,
  ConfigSchemaResponse,
  ConfigTaskResponse,
} from "@janus/api-client/contracts"
import { cn } from "@janus/ui/lib/utils"
import { ChevronRight, FileCog } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

export function ConfigNavigation({
  schema,
  selectedMenu,
  selectedTask,
  openMenuName,
  reduceMotion,
  onToggleMenu,
  onSelectTask,
}: {
  schema: ConfigSchemaResponse
  selectedMenu: ConfigMenuResponse
  selectedTask: ConfigTaskResponse
  openMenuName: string | null
  reduceMotion: boolean | null
  onToggleMenu: (menu: ConfigMenuResponse, expanded: boolean) => void
  onSelectTask: (menu: ConfigMenuResponse, task: ConfigTaskResponse) => void
}) {
  return (
    <aside className="hidden min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl bg-white/62 p-3 ring-1 ring-slate-900/6 backdrop-blur-2xl lg:flex">
      <p className="px-3 py-2 font-medium text-slate-400 text-xs">配置分区</p>
      <div className="scrollbar-hidden flex min-h-0 gap-1 overflow-x-auto overscroll-contain lg:block lg:flex-1 lg:space-y-1 lg:overflow-y-auto">
        {schema.menus.map((menu, menuIndex) => {
          const selected = menu.name === selectedMenu.name
          const expanded = menu.name === openMenuName
          const submenuId = `config-menu-${menuIndex}`
          const menuLabel = menu.displayName || menu.name
          return (
            <div key={menu.name} className="min-w-0 shrink-0 lg:w-full">
              <button
                className={cn(
                  "flex min-h-11 min-w-0 items-center gap-2 rounded-[0.85rem] px-3 text-left font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 lg:w-full",
                  selected
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-950",
                )}
                type="button"
                aria-expanded={expanded}
                aria-controls={submenuId}
                title={menuLabel}
                onClick={() => onToggleMenu(menu, expanded)}
              >
                <FileCog className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{menuLabel}</span>
                <ChevronRight
                  className={cn(
                    "size-3.5 shrink-0 text-current/55 transition-transform",
                    expanded && "rotate-90",
                  )}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    id={submenuId}
                    key="submenu"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.18,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 ml-4 space-y-0.5 border-slate-900/8 border-l pl-2">
                      {menu.tasks.map((task) => {
                        const taskLabel = task.displayName || task.name
                        const active = selected && task.name === selectedTask.name
                        return (
                          <button
                            key={task.name}
                            className={cn(
                              "flex min-h-9 w-full min-w-0 items-center rounded-[0.72rem] px-3 text-left font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                              active
                                ? "bg-slate-900/[0.07] text-slate-950"
                                : "text-slate-500 hover:bg-white/65 hover:text-slate-950",
                            )}
                            type="button"
                            aria-current={active ? "page" : undefined}
                            title={taskLabel}
                            onClick={() => onSelectTask(menu, task)}
                          >
                            <span className="min-w-0 flex-1 truncate">{taskLabel}</span>
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
    </aside>
  )
}
