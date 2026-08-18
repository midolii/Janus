import { LivePreviewWindow } from "@janus/ui/components/live-preview-window"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

const handlers = {
  onOpen: () => undefined,
  onClose: () => undefined,
  onToggleMinimized: () => undefined,
  onToggleMaximized: () => undefined,
}

describe("LivePreviewWindow", () => {
  it("renders a compact launcher while closed", () => {
    const markup = renderToStaticMarkup(
      <LivePreviewWindow
        {...handlers}
        open={false}
        minimized={false}
        maximized={false}
        title="实时截图"
        statusLabel="未连接"
      >
        preview
      </LivePreviewWindow>,
    )

    expect(markup).toContain("实时截图")
    expect(markup).not.toContain('role="region"')
  })

  it("renders window semantics and media content while open", () => {
    const markup = renderToStaticMarkup(
      <LivePreviewWindow
        {...handlers}
        open
        minimized={false}
        maximized={false}
        title="实时截图 · alas"
        statusLabel="auto · 30 FPS"
        statusTone="success"
      >
        <div role="img" aria-label="alas 实时截图" />
      </LivePreviewWindow>,
    )

    expect(markup).toContain('role="region"')
    expect(markup).toContain("实时截图 · alas")
    expect(markup).toContain("alas 实时截图")
  })
})
