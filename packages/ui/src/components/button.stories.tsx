import { Button } from "@janus/ui/components/button"
import preview from "#.storybook/preview"

const meta = preview.meta({
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Button",
  },
})

export const Default = meta.story({})

export const Outline = meta.story({
  args: {
    variant: "outline",
  },
})

export const Disabled = meta.story({
  args: {
    disabled: true,
  },
})
