import { cn } from "@janus/ui/lib/utils"
import { ChevronDown, FileCog } from "lucide-react"

export interface ConfigPagePickerSection {
  id: string
  label: string
  items: ReadonlyArray<{
    id: string
    label: string
  }>
}

export interface ConfigPagePickerProps {
  sections: readonly ConfigPagePickerSection[]
  value: string
  sectionLabel: string
  itemLabel: string
  variant?: "card" | "inline"
  className?: string
  onValueChange: (value: string) => void
}

export function ConfigPagePicker({
  sections,
  value,
  sectionLabel,
  itemLabel,
  variant = "card",
  className,
  onValueChange,
}: ConfigPagePickerProps) {
  return (
    <label
      className={cn(
        "relative flex min-w-0 items-center gap-3 overflow-hidden",
        variant === "card"
          ? "min-h-16 rounded-2xl bg-white/62 px-4 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.62)] backdrop-blur-2xl"
          : "min-h-12",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
        <FileCog className="size-4" aria-hidden="true" />
      </span>
      <span className="pointer-events-none min-w-0 flex-1">
        <span className="block truncate text-slate-500 text-xs" title={sectionLabel}>
          {sectionLabel}
        </span>
        <span className="mt-0.5 block truncate font-medium text-sm" title={itemLabel}>
          {itemLabel}
        </span>
      </span>
      <ChevronDown
        className="pointer-events-none size-4 shrink-0 text-slate-400"
        aria-hidden="true"
      />
      <select
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        value={value}
        aria-label="选择配置页面"
        onChange={(event) => onValueChange(event.target.value)}
      >
        {sections.map((section) => (
          <optgroup key={section.id} label={section.label}>
            {section.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
