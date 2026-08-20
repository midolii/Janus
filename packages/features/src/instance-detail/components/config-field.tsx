import type { ConfigFieldResponse } from "@janus/api-client/contracts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@janus/ui/components/select"
import { cn } from "@janus/ui/lib/utils"
import { LockKeyhole } from "lucide-react"
import { isSameConfigOptionValue, normalizeConfigDateTimeInput } from "../config-editor-utils"
import { formatConfigValue } from "../instance-detail-utils"

export function ConfigField({
  field,
  value,
  changed,
  redacted,
  onChange,
}: {
  field: ConfigFieldResponse
  value: unknown
  changed: boolean
  redacted: boolean
  onChange: (value: unknown) => void
}) {
  const readOnly = field.readOnly || field.display === "disabled"
  const option = field.options.find((item) => isSameConfigOptionValue(item.value, value))
  const displayValue =
    redacted || field.sensitive ? "••••••" : (option?.label ?? formatConfigValue(value))

  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl bg-slate-900/[0.035] px-4 py-3.5 ring-blue-500/15 transition-shadow",
        changed && "ring-2",
      )}
    >
      <dt className="flex min-w-0 items-start justify-between gap-3">
        <span
          className="min-w-0 flex-1 truncate font-medium text-sm"
          title={field.displayName || field.name}
        >
          {field.displayName || field.name}
        </span>
        {readOnly ? (
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-label="只读" />
        ) : null}
      </dt>
      <dd className="mt-2 min-h-8 min-w-0 text-slate-600 text-sm">
        {readOnly ? (
          <span className="block min-w-0 truncate py-1.5" title={displayValue}>
            {displayValue}
          </span>
        ) : (
          <ConfigFieldControl
            field={field}
            value={value}
            redacted={redacted && !changed}
            onChange={onChange}
          />
        )}
      </dd>
      {field.help ? (
        <p className="wrap-break-word mt-2 whitespace-pre-wrap text-slate-500 text-xs leading-5">
          {field.help}
        </p>
      ) : null}
    </div>
  )
}

function ConfigFieldControl({
  field,
  value,
  redacted,
  onChange,
}: {
  field: ConfigFieldResponse
  value: unknown
  redacted: boolean
  onChange: (value: unknown) => void
}) {
  if (field.widgetType === "checkbox") {
    const checked = value === true
    return (
      <button
        className={cn(
          "flex h-8 items-center gap-2 rounded-xl px-1.5 pr-2.5 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
          checked ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700",
        )}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span
          className={cn(
            "relative h-5 w-9 rounded-full ring-1 transition-colors",
            checked ? "bg-white/24 ring-white/30" : "bg-slate-500/28 ring-slate-600/20",
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm ring-1 ring-black/8 transition-transform",
              checked ? "translate-x-4" : "translate-x-0",
            )}
          />
        </span>
        {checked ? "已启用" : "已关闭"}
      </button>
    )
  }

  if (field.widgetType === "select" && field.options.length > 0) {
    const selectedIndex = field.options.findIndex((option) =>
      isSameConfigOptionValue(option.value, value),
    )
    const selectItems = field.options.map((option, index) => ({
      label: option.label,
      value: String(index),
    }))
    return (
      <Select
        items={selectItems}
        value={selectedIndex >= 0 ? String(selectedIndex) : null}
        onValueChange={(nextValue) => {
          const selected = field.options[Number(nextValue)]
          if (selected) {
            onChange(selected.value)
          }
        }}
      >
        <SelectTrigger className="h-9 w-full rounded-xl border-slate-900/10 bg-white/75">
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option, index) => (
            <SelectItem key={getConfigOptionKey(field.key, option)} value={String(index)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.widgetType === "multiselect" && field.options.length > 0) {
    const selectedValues = Array.isArray(value) ? value : []
    return (
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((option) => {
          const selected = selectedValues.some((item) =>
            isSameConfigOptionValue(item, option.value),
          )
          return (
            <button
              key={getConfigOptionKey(field.key, option)}
              className={cn(
                "min-h-8 rounded-xl px-2.5 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
                selected ? "bg-slate-950 text-white" : "bg-white/75 text-slate-600",
              )}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  selected
                    ? selectedValues.filter((item) => !isSameConfigOptionValue(item, option.value))
                    : [...selectedValues, option.value],
                )
              }
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (field.widgetType === "textarea" || field.widgetType === "task_priority") {
    return (
      <textarea
        className="min-h-24 w-full resize-y rounded-xl border border-slate-900/10 bg-white/75 px-3 py-2 text-slate-800 text-sm outline-none transition-shadow focus:border-blue-500/50 focus:ring-3 focus:ring-blue-500/10"
        value={redacted ? "" : stringifyInputValue(value)}
        placeholder={redacted ? "输入新值（未输入则不修改）" : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    )
  }

  if (field.widgetType === "datetime") {
    return (
      <input
        className="h-9 w-full rounded-xl border border-slate-900/10 bg-white/75 px-3 text-slate-800 text-sm outline-none transition-shadow focus:border-blue-500/50 focus:ring-3 focus:ring-blue-500/10"
        type="datetime-local"
        step="1"
        value={normalizeConfigDateTimeInput(stringifyInputValue(value))}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    )
  }

  return (
    <input
      className="h-9 w-full rounded-xl border border-slate-900/10 bg-white/75 px-3 text-slate-800 text-sm outline-none transition-shadow focus:border-blue-500/50 focus:ring-3 focus:ring-blue-500/10"
      type={field.sensitive ? "password" : "text"}
      value={redacted ? "" : stringifyInputValue(value)}
      placeholder={redacted ? "输入新值（未输入则不修改）" : undefined}
      autoComplete={field.sensitive ? "new-password" : undefined}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  )
}

function stringifyInputValue(value: unknown): string {
  if (value === undefined || value === null) {
    return ""
  }
  return typeof value === "object" ? JSON.stringify(value) : String(value)
}

function getConfigOptionKey(
  fieldKey: string,
  option: ConfigFieldResponse["options"][number],
): string {
  return `${fieldKey}:${option.label}:${JSON.stringify(option.value)}`
}
