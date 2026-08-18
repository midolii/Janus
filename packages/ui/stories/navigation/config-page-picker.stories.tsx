import {
  ConfigPagePicker,
  type ConfigPagePickerSection,
} from "@janus/ui/components/config-page-picker"
import { useState } from "react"
import preview from "#.storybook/preview"

const sections: ConfigPagePickerSection[] = [
  {
    id: "alas",
    label: "智慧港区Plus",
    items: [
      { id: "alas:settings", label: "智慧港区设置" },
      { id: "alas:general", label: "通用设置" },
      { id: "alas:restart", label: "重启设置" },
    ],
  },
  {
    id: "farm",
    label: "出击Plus",
    items: [
      { id: "farm:main", label: "主线图-1Plus" },
      { id: "farm:long", label: "1-1刷伏击（尚不完善且名称很长）" },
    ],
  },
]

function InteractivePicker({ variant }: { variant: "card" | "inline" }) {
  const [value, setValue] = useState("alas:settings")
  const section = sections.find((candidate) => candidate.items.some((item) => item.id === value))
  const item = section?.items.find((candidate) => candidate.id === value)

  return (
    <ConfigPagePicker
      className="w-full max-w-md"
      sections={sections}
      value={value}
      variant={variant}
      sectionLabel={section?.label ?? "选择配置分区"}
      itemLabel={item?.label ?? "选择配置页面"}
      onValueChange={setValue}
    />
  )
}

const meta = preview.meta({
  title: "Navigation/ConfigPagePicker",
  component: ConfigPagePicker,
  args: {
    sections,
    value: "alas:settings",
    sectionLabel: "智慧港区Plus",
    itemLabel: "智慧港区设置",
    onValueChange: () => undefined,
  },
  parameters: {
    layout: "centered",
  },
})

export const Card = meta.story({
  render: () => <InteractivePicker variant="card" />,
})

export const Inline = meta.story({
  render: () => (
    <div className="w-80 rounded-3xl bg-white/70 px-4 py-3">
      <InteractivePicker variant="inline" />
    </div>
  ),
})
