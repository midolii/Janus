import type {
  ConfigFieldResponse,
  ConfigGroupResponse,
  ConfigMenuResponse,
  ConfigResponse,
  ConfigTaskResponse,
} from "@janus/api-client/contracts"
import type { ComponentType } from "react"
import { getEffectiveConfigValue } from "../config-editor-utils"
import { getConfigValue } from "../instance-detail-utils"
import { ConfigField } from "./config-field"

export interface ConfigGroupRendererProps {
  moduleName: string
  menu: ConfigMenuResponse
  task: ConfigTaskResponse
  group: ConfigGroupResponse
  config: ConfigResponse
  changes: Record<string, unknown>
  onFieldChange: (path: string, value: unknown) => void
}

export interface ConfigGroupRendererMatch {
  moduleName?: string
  menuName?: string
  taskName?: string
  groupName: string
  requiredFields?: ReadonlyArray<{
    name: string
    widgetType?: string
  }>
}

interface ConfigGroupRendererRegistration {
  id: string
  match: ConfigGroupRendererMatch
  component: ComponentType<ConfigGroupRendererProps>
}

/**
 * Register specialized group layouts here, from the most specific matcher to the most general.
 * For example, an Emotion renderer can match groupName plus its stable field names and will then
 * work for Main, Main2, Main3, and future tasks without depending on translated display labels.
 */
const customConfigGroupRenderers: readonly ConfigGroupRendererRegistration[] = []

export function ConfigGroupRenderer(props: ConfigGroupRendererProps) {
  const registration = customConfigGroupRenderers.find(({ match }) =>
    matchesConfigGroupRenderer(match, props),
  )
  const Renderer = registration?.component ?? DefaultConfigGroupRenderer

  return <Renderer {...props} />
}

export function matchesConfigGroupRenderer(
  match: ConfigGroupRendererMatch,
  context: ConfigGroupRendererProps,
): boolean {
  if (
    (match.moduleName !== undefined && match.moduleName !== context.moduleName) ||
    (match.menuName !== undefined && match.menuName !== context.menu.name) ||
    (match.taskName !== undefined && match.taskName !== context.task.name) ||
    match.groupName !== context.group.name
  ) {
    return false
  }

  return (match.requiredFields ?? []).every((requiredField) =>
    context.group.fields.some(
      (field) =>
        field.name === requiredField.name &&
        (requiredField.widgetType === undefined || field.widgetType === requiredField.widgetType),
    ),
  )
}

export function getConfigGroupField(
  group: ConfigGroupResponse,
  fieldName: string,
): ConfigFieldResponse | undefined {
  return group.fields.find((field) => field.name === fieldName)
}

export function getConfigGroupFieldValue(
  context: ConfigGroupRendererProps,
  fieldName: string,
): unknown {
  const field = getConfigGroupField(context.group, fieldName)
  return field
    ? getEffectiveConfigValue(
        context.changes,
        field.key,
        getConfigValue(context.config.values, field.key),
      )
    : undefined
}

function DefaultConfigGroupRenderer({
  group,
  config,
  changes,
  onFieldChange,
}: ConfigGroupRendererProps) {
  return (
    <section className="px-5 py-5 sm:px-6">
      <h3 className="truncate font-medium text-sm" title={group.displayName || group.name}>
        {group.displayName || group.name}
      </h3>
      {group.help ? (
        <p className="wrap-break-word mt-1 whitespace-pre-wrap text-slate-500 text-xs leading-5">
          {group.help}
        </p>
      ) : null}
      <dl className="mt-4 space-y-2">
        {group.fields.map((field) => (
          <ConfigField
            key={field.key}
            field={field}
            value={getEffectiveConfigValue(
              changes,
              field.key,
              getConfigValue(config.values, field.key),
            )}
            changed={Object.hasOwn(changes, field.key)}
            redacted={config.redactedPaths.includes(field.key)}
            onChange={(value) => onFieldChange(field.key, value)}
          />
        ))}
      </dl>
    </section>
  )
}
