import type {
  ConfigGroupResponse,
  ConfigMenuResponse,
  ConfigSchemaResponse,
  ConfigTaskResponse,
} from "@janus/api-client/contracts"
import { ConfigPagePicker } from "@janus/ui/components/config-page-picker"
import { cn } from "@janus/ui/lib/utils"

export function ConfigWorkspaceHeader({
  schema,
  selectedMenu,
  selectedTask,
  groups,
  currentGroupName,
  onSelectTask,
  onSelectGroup,
}: {
  schema: ConfigSchemaResponse
  selectedMenu: ConfigMenuResponse
  selectedTask: ConfigTaskResponse
  groups: ConfigGroupResponse[]
  currentGroupName: string | null
  onSelectTask: (menu: ConfigMenuResponse, task: ConfigTaskResponse) => void
  onSelectGroup: (groupName: string) => void
}) {
  const selectedTaskOptionId = getConfigTaskOptionId(selectedMenu.name, selectedTask.name)
  const pickerSections = schema.menus.map((menu) => ({
    id: menu.name,
    label: menu.displayName || menu.name,
    items: menu.tasks.map((task) => ({
      id: getConfigTaskOptionId(menu.name, task.name),
      label: task.displayName || task.name,
    })),
  }))

  return (
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
              onSelectTask(menu, task)
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
      {groups.length > 0 ? (
        <div
          className="scrollbar-hidden mt-4 flex gap-1 overflow-x-auto overscroll-contain rounded-[0.95rem] bg-slate-900/[0.035] p-1"
          aria-label="配置块"
          role="tablist"
        >
          {groups.map((group) => {
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
                onClick={() => onSelectGroup(group.name)}
              >
                {groupLabel}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function getConfigTaskOptionId(menuName: string, taskName: string): string {
  return JSON.stringify([menuName, taskName])
}
