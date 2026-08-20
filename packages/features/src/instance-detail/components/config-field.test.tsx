import type { ConfigFieldResponse } from "@janus/api-client/contracts"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ConfigField } from "./config-field"

function createField(overrides: Partial<ConfigFieldResponse>): ConfigFieldResponse {
  return {
    key: "Alas.Emulator.ScreenshotMethod",
    name: "ScreenshotMethod",
    displayName: "选择截图方案",
    help: "选择用于设备截图的方案",
    widgetType: "select",
    default: null,
    options: [],
    display: null,
    readOnly: false,
    sensitive: false,
    ...overrides,
  }
}

describe("ConfigField", () => {
  it("renders the selected option label instead of its internal index", () => {
    const markup = renderToStaticMarkup(
      <ConfigField
        field={createField({
          options: [
            { label: "DroidCast 原始流", value: 7 },
            { label: "ADB 截图", value: 2 },
          ],
        })}
        value="7"
        changed={false}
        redacted={false}
        onChange={() => undefined}
      />,
    )

    expect(markup).toMatch(/data-slot="select-value"[^>]*>DroidCast 原始流<\/span>/)
  })

  it("keeps the active switch thumb inset equally on both sides", () => {
    const markup = renderToStaticMarkup(
      <ConfigField
        field={createField({
          key: "Alas.Emulator.UseRecommendedSettings",
          name: "UseRecommendedSettings",
          displayName: "自动应用推荐游戏设置",
          widgetType: "checkbox",
        })}
        value={true}
        changed={false}
        redacted={false}
        onChange={() => undefined}
      />,
    )

    expect(markup).toContain("left-0.5")
    expect(markup).toContain("translate-x-4")
    expect(markup).toContain('aria-checked="true"')
  })
})
