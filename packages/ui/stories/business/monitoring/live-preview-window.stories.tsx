import { type LivePreviewMode, LivePreviewWindow } from "@janus/ui/components/live-preview-window"
import { useState } from "react"
import preview from "#.storybook/preview"

function InteractiveWindow({ initialMode }: { initialMode: LivePreviewMode }) {
  const [mode, setMode] = useState(initialMode)

  return (
    <div className="h-dvh bg-[linear-gradient(145deg,#e6eff3,#cadde6)] p-5">
      <div className="h-full rounded-4xl border border-white/70 bg-white/45 p-8 backdrop-blur-2xl">
        <p className="font-semibold text-slate-900 text-xl">Janus 运行概览</p>
        <p className="mt-1 text-slate-500 text-sm">浮窗独立于页面内容与路由存在。</p>
      </div>
      <LivePreviewWindow
        mode={mode}
        title="实时截图 · alas"
        statusLabel="scrcpy · 30 FPS"
        statusTone="success"
        launcherStorageKey={`storybook.live-preview.${initialMode}`}
        onModeChange={setMode}
      >
        <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,#183b57,#05080d_66%)]">
          <div className="text-center">
            <p className="font-medium text-sm text-white/85">1280 × 720</p>
            <p className="mt-1 text-white/38 text-xs">媒体画布占位</p>
          </div>
        </div>
      </LivePreviewWindow>
    </div>
  )
}

const meta = preview.meta({
  title: "Business/Monitoring/LivePreviewWindow",
  component: LivePreviewWindow,
  parameters: { layout: "fullscreen" },
})

export const Floating = meta.story({
  render: () => <InteractiveWindow initialMode="windowed" />,
})

export const Launcher = meta.story({
  render: () => <InteractiveWindow initialMode="closed" />,
})

export const Minimized = meta.story({
  render: () => <InteractiveWindow initialMode="minimized" />,
})

export const Fullscreen = meta.story({
  render: () => <InteractiveWindow initialMode="fullscreen" />,
})
