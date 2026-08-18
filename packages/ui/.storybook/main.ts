import { defineMain } from "@storybook/react-vite/node"
import tailwindcss from "@tailwindcss/vite"
import { mergeConfig } from "vite"

export default defineMain({
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
    })
  },
})
