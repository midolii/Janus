import type { ConfigResponse, ConfigSchemaResponse } from "@janus/api-client/contracts"
import { ConfigPagePicker } from "@janus/ui/components/config-page-picker"
import { cn } from "@janus/ui/lib/utils"
import { ChevronRight, FileCog } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useRef, useState } from "react"
import { ConfigGroupRenderer } from "./config-group-renderer"
import { ConfigWorkspaceSkeleton } from "./instance-detail-skeletons"
import { EmptyPanel, ErrorPanel, PageHeading } from "./instance-panel-primitives"

export function ConfigPanel({
  config,
  schema,
  pending,
  error,
}: {
  config?: ConfigResponse
  schema?: ConfigSchemaResponse
  pending: boolean
  error: Error | null
}) {
  const [selectedMenuName, setSelectedMenuName] = useState<string | null>(null)
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null)
  const [expandedMenuName, setExpandedMenuName] = useState<false | string | null>(null)
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // A selection from another instance may no longer exist. Falling back during render avoids
  // synchronization effects and keeps instance switches deterministic.
  const selectedMenu =
    schema?.menus.find((menu) => menu.name === selectedMenuName) ?? schema?.menus[0]
  const selectedTask =
    selectedMenu?.tasks.find((task) => task.name === selectedTaskName) ?? selectedMenu?.tasks[0]

  if (pending) {
    return (
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col">
        <PageHeading title="配置浏览" detail="当前为只读模式；写入接口开放后将在此启用编辑。" />
        <ConfigWorkspaceSkeleton />
      </div>
    )
  }

  if (error) {
    return <ErrorPanel title="配置读取失败" detail={error.message} />
  }

  if (!config || !schema || !selectedMenu || !selectedTask) {
    return <EmptyPanel title="没有可显示的配置" detail="此实例没有返回配置 Schema。" />
  }

  const selectedGroups = selectedTask.groups
  const openMenuName = expandedMenuName === null ? selectedMenu.name : expandedMenuName || null
  const currentGroup =
    selectedGroups.find((group) => group.name === activeGroupName) ?? selectedGroups[0]
  const currentGroupName = currentGroup?.name ?? null
  const selectedTaskOptionId = getConfigTaskOptionId(selectedMenu.name, selectedTask.name)
  const pickerSections = schema.menus.map((menu) => ({
    id: menu.name,
    label: menu.displayName || menu.name,
    items: menu.tasks.map((task) => ({
      id: getConfigTaskOptionId(menu.name, task.name),
      label: task.displayName || task.name,
    })),
  }))

  function selectTask(menuName: string, taskName: string, firstGroupName: string | null) {
    setSelectedMenuName(menuName)
    setSelectedTaskName(taskName)
    setActiveGroupName(firstGroupName)
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }

  function selectGroup(groupName: string) {
    setActiveGroupName(groupName)
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col">
      <PageHeading title="配置浏览" detail="当前为只读模式；写入接口开放后将在此启用编辑。" />
      <div className="mt-4 grid min-h-0 flex-1 gap-3 lg:mt-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:grid-rows-1 lg:gap-5">
        <aside className="hidden min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl bg-white/62 p-3 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl lg:flex">
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
                    onClick={() => {
                      if (expanded) {
                        setExpandedMenuName(false)
                        return
                      }
                      setExpandedMenuName(menu.name)
                      setSelectedMenuName(menu.name)
                      setSelectedTaskName(null)
                      setActiveGroupName(menu.tasks[0]?.groups[0]?.name ?? null)
                      if (contentRef.current) {
                        contentRef.current.scrollTop = 0
                      }
                    }}
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
                                onClick={() =>
                                  selectTask(menu.name, task.name, task.groups[0]?.name ?? null)
                                }
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

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl bg-white/62 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
          <div className="shrink-0 border-slate-900/6 border-b px-4 py-4 sm:px-6 sm:py-5">
            <ConfigPagePicker
              className="lg:hidden"
              sections={pickerSections}
              value={selectedTaskOptionId}
              variant="inline"
              sectionLabel={selectedMenu.displayName || selectedMenu.name}
              itemLabel={selectedTask.displayName || selectedTask.name}
              onValueChange={(value) => {
                for (const menu of schema.menus) {
                  const task = menu.tasks.find(
                    (candidate) => getConfigTaskOptionId(menu.name, candidate.name) === value,
                  )
                  if (task) {
                    selectTask(menu.name, task.name, task.groups[0]?.name ?? null)
                    return
                  }
                }
              }}
            />
            <div className="hidden lg:block">
              <p
                className="truncate text-slate-500 text-xs"
                title={selectedMenu.displayName || selectedMenu.name}
              >
                {selectedMenu.displayName || selectedMenu.name}
              </p>
              <h2
                className="mt-1 truncate font-semibold text-lg tracking-tight"
                title={selectedTask.displayName || selectedTask.name}
              >
                {selectedTask.displayName || selectedTask.name}
              </h2>
              {selectedTask.help ? (
                <p className="wrap-break-word mt-2 whitespace-pre-wrap text-slate-500 text-xs leading-5">
                  {selectedTask.help}
                </p>
              ) : null}
            </div>
            {selectedGroups.length > 0 ? (
              <div
                className="scrollbar-hidden mt-4 flex gap-1 overflow-x-auto overscroll-contain rounded-[0.95rem] bg-slate-900/[0.035] p-1"
                aria-label="配置块"
                role="tablist"
              >
                {selectedGroups.map((group) => {
                  const groupLabel = group.displayName || group.name
                  return (
                    <button
                      key={group.name}
                      className={cn(
                        "min-h-10 max-w-44 shrink-0 truncate rounded-[0.72rem] px-3 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                        group.name === currentGroupName
                          ? "bg-white text-slate-950 shadow-[0_5px_14px_-10px_rgba(15,23,42,0.7)]"
                          : "text-slate-500 hover:text-slate-950",
                      )}
                      type="button"
                      role="tab"
                      aria-selected={group.name === currentGroupName}
                      title={groupLabel}
                      onClick={() => selectGroup(group.name)}
                    >
                      {groupLabel}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {selectedTask.help ? (
              <p className="wrap-break-word whitespace-pre-wrap px-5 pt-4 text-slate-500 text-xs leading-5 sm:px-6 lg:hidden">
                {selectedTask.help}
              </p>
            ) : null}
            {currentGroup ? (
              <ConfigGroupRenderer
                key={currentGroup.name}
                moduleName={schema.module}
                menu={selectedMenu}
                task={selectedTask}
                group={currentGroup}
                config={config}
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

function getConfigTaskOptionId(menuName: string, taskName: string): string {
  return JSON.stringify([menuName, taskName])
}
