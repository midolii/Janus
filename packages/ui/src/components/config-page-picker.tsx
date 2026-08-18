import { cn } from "@janus/ui/lib/utils"
import { FileCog } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "./select"

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
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue !== null) {
          onValueChange(nextValue)
        }
      }}
    >
      <SelectTrigger
        className={cn(
          "min-h-12 w-full min-w-0 justify-start gap-3 overflow-hidden border-0 px-0 py-0 text-left shadow-none focus-visible:ring-blue-500/60",
          variant === "card"
            ? "min-h-16 rounded-2xl bg-white/62 px-4 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.62)] backdrop-blur-2xl"
            : "rounded-none",
          className,
        )}
        aria-label="选择配置页面"
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
      </SelectTrigger>
      <SelectContent
        className="rounded-2xl border border-white/70 bg-white/88 p-1 shadow-xl backdrop-blur-2xl"
        align="start"
        alignItemWithTrigger={false}
      >
        {sections.map((section) => (
          <SelectGroup key={section.id}>
            <SelectLabel className="truncate px-2.5 pt-2 pb-1 font-medium text-slate-400">
              {section.label}
            </SelectLabel>
            {section.items.map((item) => (
              <SelectItem
                key={item.id}
                className="min-h-10 cursor-pointer rounded-xl px-2.5 pr-9 text-slate-600 focus:bg-slate-100 focus:text-slate-950 data-selected:font-medium"
                value={item.id}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
