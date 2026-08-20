import type {
  ConfigPatchRequest,
  ConfigResponse,
  ConfigSchemaResponse,
} from "@janus/api-client/contracts"
import { Button } from "@janus/ui/components/button"
import { useForm } from "@tanstack/react-form"
import { RotateCcw, Save } from "lucide-react"
import { useReducedMotion } from "motion/react"
import { useRef, useState } from "react"
import { buildConfigPatchRequest, updateConfigChanges } from "../config-editor-utils"
import { getConfigValue } from "../instance-detail-utils"
import { ConfigGroupRenderer } from "./config-group-renderer"
import { ConfigNavigation } from "./config-navigation"
import { ConfigWorkspaceHeader } from "./config-workspace-header"
import { ConfigWorkspaceSkeleton } from "./instance-detail-skeletons"
import { EmptyPanel, ErrorPanel, PageHeading } from "./instance-panel-primitives"

export function ConfigPanel({
  config,
  schema,
  pending,
  error,
  saveError,
  onSave,
}: {
  config?: ConfigResponse
  schema?: ConfigSchemaResponse
  pending: boolean
  error: Error | null
  saveError: Error | null
  onSave: (request: ConfigPatchRequest) => Promise<ConfigResponse>
}) {
  const [selectedMenuName, setSelectedMenuName] = useState<string | null>(null)
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null)
  const [expandedMenuName, setExpandedMenuName] = useState<false | string | null>(null)
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const form = useForm({
    defaultValues: { changes: {} as Record<string, unknown> },
    onSubmit: async ({ value }) => {
      if (!config || Object.keys(value.changes).length === 0) {
        return
      }
      await onSave(buildConfigPatchRequest(config.revision, value.changes))
    },
  })

  // Selection state is retained across refetches. A missing item falls back during render so an
  // instance switch does not need synchronization effects or briefly show another instance.
  const selectedMenu =
    schema?.menus.find((menu) => menu.name === selectedMenuName) ?? schema?.menus[0]
  const selectedTask =
    selectedMenu?.tasks.find((task) => task.name === selectedTaskName) ?? selectedMenu?.tasks[0]

  if (pending) {
    return (
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col">
        <PageHeading title="配置管理" detail="读取配置结构并安全地提交本次修改。" />
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

  function resetContentScroll() {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }

  function selectTask(menuName: string, taskName: string, firstGroupName: string | null) {
    setSelectedMenuName(menuName)
    setSelectedTaskName(taskName)
    setActiveGroupName(firstGroupName)
    resetContentScroll()
  }

  function selectGroup(groupName: string) {
    setActiveGroupName(groupName)
    resetContentScroll()
  }

  return (
    <form
      className="mx-auto flex h-full min-h-0 max-w-6xl flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form
          .handleSubmit()
          .then(() => form.reset())
          .catch(() => undefined)
      }}
    >
      <div className="flex shrink-0 items-start justify-between gap-4">
        <PageHeading title="配置管理" detail="修改只会在点击保存后写入当前实例。" />
        <form.Subscribe selector={(state) => [state.values.changes, state.isSubmitting] as const}>
          {([changes, isSubmitting]) => {
            const changeCount = Object.keys(changes).length
            return (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={changeCount === 0 || isSubmitting}
                  onClick={() => form.reset()}
                >
                  <RotateCcw aria-hidden="true" />
                  <span className="hidden sm:inline">撤销</span>
                </Button>
                <Button type="submit" disabled={changeCount === 0 || isSubmitting}>
                  <Save aria-hidden="true" />
                  {isSubmitting ? "保存中" : changeCount > 0 ? `保存 ${changeCount} 项` : "保存"}
                </Button>
              </div>
            )
          }}
        </form.Subscribe>
      </div>
      {saveError ? (
        <p
          className="mt-3 shrink-0 rounded-xl bg-red-50 px-3 py-2 text-red-800 text-xs"
          role="alert"
        >
          保存失败：{saveError.message}
        </p>
      ) : null}
      <form.Field name="changes">
        {(changesField) => (
          <div className="mt-4 grid min-h-0 flex-1 gap-3 lg:mt-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:grid-rows-1 lg:gap-5">
            <ConfigNavigation
              schema={schema}
              selectedMenu={selectedMenu}
              selectedTask={selectedTask}
              openMenuName={openMenuName}
              reduceMotion={reduceMotion}
              onToggleMenu={(menu, expanded) => {
                if (expanded) {
                  setExpandedMenuName(false)
                  return
                }
                setExpandedMenuName(menu.name)
                selectTask(
                  menu.name,
                  menu.tasks[0]?.name ?? "",
                  menu.tasks[0]?.groups[0]?.name ?? null,
                )
              }}
              onSelectTask={(menu, task) =>
                selectTask(menu.name, task.name, task.groups[0]?.name ?? null)
              }
            />

            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl bg-white/62 ring-1 ring-slate-900/6 backdrop-blur-2xl">
              <ConfigWorkspaceHeader
                schema={schema}
                selectedMenu={selectedMenu}
                selectedTask={selectedTask}
                groups={selectedGroups}
                currentGroupName={currentGroupName}
                onSelectTask={(menu, task) =>
                  selectTask(menu.name, task.name, task.groups[0]?.name ?? null)
                }
                onSelectGroup={selectGroup}
              />
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
                    changes={changesField.state.value}
                    onFieldChange={(path, value) =>
                      changesField.handleChange((changes) =>
                        updateConfigChanges(
                          changes,
                          path,
                          value,
                          getConfigValue(config.values, path),
                        ),
                      )
                    }
                  />
                ) : null}
              </div>
            </section>
          </div>
        )}
      </form.Field>
    </form>
  )
}
