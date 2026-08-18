import type {
  ConfigFieldResponse,
  ConfigGroupResponse,
  ConfigMenuResponse,
  ConfigResponse,
  ConfigTaskResponse,
} from "@janus/api-client/contracts"
import { cn } from "@janus/ui/lib/utils"
import { Check, LockKeyhole } from "lucide-react"
import type { ComponentType } from "react"
import { formatConfigValue, getConfigValue } from "./instance-detail-utils"

export interface ConfigGroupRendererProps {
  moduleName: string
  menu: ConfigMenuResponse
  task: ConfigTaskResponse
  group: ConfigGroupResponse
  config: ConfigResponse
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
  return field ? getConfigValue(context.config.values, field.key) : undefined
}

function DefaultConfigGroupRenderer({ group, config }: ConfigGroupRendererProps) {
  return (
    <section className="px-5 py-5 sm:px-6">
      <h3 className="truncate font-medium text-sm" title={group.displayName || group.name}>
        {group.displayName || group.name}
      </h3>
      {group.help ? (
        <p className="mt-1 whitespace-pre-wrap break-words text-slate-500 text-xs leading-5">
          {group.help}
        </p>
      ) : null}
      <dl className="mt-4 space-y-2">
        {group.fields.map((field) => (
          <ConfigField
            key={field.key}
            field={field}
            value={getConfigValue(config.values, field.key)}
            redacted={config.redactedPaths.includes(field.key)}
          />
        ))}
      </dl>
    </section>
  )
}

function ConfigField({
  field,
  value,
  redacted,
}: {
  field: ConfigFieldResponse
  value: unknown
  redacted: boolean
}) {
  const option = field.options.find((item) => Object.is(item.value, value))
  const displayValue =
    redacted || field.sensitive ? "••••••" : (option?.label ?? formatConfigValue(value))
  const booleanValue = typeof value === "boolean" ? value : undefined

  return (
    <div className="min-w-0 rounded-2xl bg-slate-900/[0.035] px-4 py-3.5">
      <dt className="flex min-w-0 items-start justify-between gap-3">
        <span
          className="min-w-0 flex-1 truncate font-medium text-sm"
          title={field.displayName || field.name}
        >
          {field.displayName || field.name}
        </span>
        {field.readOnly || field.display === "disabled" ? (
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-label="只读" />
        ) : null}
      </dt>
      <dd className="mt-2 flex min-h-6 min-w-0 items-center gap-2 text-slate-600 text-sm">
        {booleanValue !== undefined && !redacted && !field.sensitive ? (
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md",
              booleanValue ? "bg-blue-600 text-white" : "bg-slate-200 text-transparent",
            )}
            aria-hidden="true"
          >
            <Check className="size-3.5" />
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate" title={displayValue}>
          {displayValue}
        </span>
      </dd>
      {field.help ? (
        <p className="mt-2 whitespace-pre-wrap break-words text-slate-500 text-xs leading-5">
          {field.help}
        </p>
      ) : null}
    </div>
  )
}
