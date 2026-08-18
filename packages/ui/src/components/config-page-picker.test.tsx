import { ConfigPagePicker } from "@janus/ui/components/config-page-picker"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("ConfigPagePicker", () => {
  it("preserves configuration hierarchy with native option groups", () => {
    const markup = renderToStaticMarkup(
      <ConfigPagePicker
        sections={[
          {
            id: "farm",
            label: "出击Plus",
            items: [{ id: "farm:main", label: "主线图-1Plus" }],
          },
        ]}
        value="farm:main"
        sectionLabel="出击Plus"
        itemLabel="主线图-1Plus"
        onValueChange={() => undefined}
      />,
    )

    expect(markup).toContain('<optgroup label="出击Plus">')
    expect(markup).toContain('value="farm:main" selected="">主线图-1Plus')
    expect(markup).toContain('aria-label="选择配置页面"')
  })
})
