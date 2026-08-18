import { DateDisplay } from "@janus/ui/components/date-display"
import preview from "#.storybook/preview"

const exampleDate = new Date("2026-08-18T09:31:08+08:00")

const meta = preview.meta({
  title: "Business/Foundations/DateDisplay",
  component: DateDisplay,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    value: exampleDate,
  },
})

export const Absolute = meta.story({})

export const Relative = meta.story({
  args: {
    mode: "relative",
    referenceTime: new Date("2026-08-18T08:31:08+08:00"),
  },
})

export const Missing = meta.story({
  args: {
    fallback: "尚未安排",
    value: null,
  },
})
