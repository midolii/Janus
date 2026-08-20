import { type LivePreviewMode, LivePreviewWindow } from "@janus/ui/components/live-preview-window"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

function renderWindow(mode: LivePreviewMode) {
  return renderToStaticMarkup(
    <LivePreviewWindow
      mode={mode}
      title="实时截图 · alas"
      statusLabel="auto · 30 FPS"
      statusTone="success"
      onModeChange={() => undefined}
    >
      <div role="img" aria-label="alas 实时截图" />
    </LivePreviewWindow>,
  )
}

describe("LivePreviewWindow", () => {
  it("renders a compact launcher while closed", () => {
    const markup = renderWindow("closed")

    expect(markup).toContain("实时截图")
    expect(markup).not.toContain('role="region"')
  })

  it("renders window semantics, controls, and media while windowed", () => {
    const markup = renderWindow("windowed")

    expect(markup).toContain('role="region"')
    expect(markup).toContain("实时截图 · alas")
    expect(markup).toContain("alas 实时截图")
    expect(markup).toContain("调整实时截图窗口大小")
    expect(markup).toContain("全屏显示实时截图")
  })

  it("keeps media mounted but visually hides it while minimized", () => {
    const markup = renderWindow("minimized")

    // The mounted child owns the WebSocket session, so minimizing must only hide it.
    expect(markup).toContain("alas 实时截图")
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain("lucide-plus")
    expect(markup).not.toContain("调整实时截图窗口大小")
  })

  it("uses an image-only viewport and a dedicated exit control in fullscreen", () => {
    const markup = renderWindow("fullscreen")

    expect(markup).toContain("alas 实时截图")
    expect(markup).toContain("退出全屏")
    expect(markup).not.toContain("关闭实时截图")
    expect(markup).not.toContain("全屏显示实时截图")
  })
})
