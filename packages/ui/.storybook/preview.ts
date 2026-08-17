import addonA11y from "@storybook/addon-a11y"
import { definePreview } from "@storybook/react-vite"

import "../src/styles/globals.css"

export default definePreview({
  addons: [addonA11y()],
  parameters: {
    a11y: {
      test: "todo",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
})
