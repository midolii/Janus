import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@janus/ui/components/select"
import preview from "#.storybook/preview"

const meta = preview.meta({
  title: "Components/Shadcn/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
})

export const Grouped = meta.story({
  render: () => (
    <Select defaultValue="alas:settings">
      <SelectTrigger className="w-72">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectLabel>智慧港区Plus</SelectLabel>
          <SelectItem value="alas:settings">智慧港区设置</SelectItem>
          <SelectItem value="alas:general">通用设置</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>出击Plus</SelectLabel>
          <SelectItem value="farm:main">主线图-1Plus</SelectItem>
          <SelectItem value="farm:event">活动图Plus</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
})
