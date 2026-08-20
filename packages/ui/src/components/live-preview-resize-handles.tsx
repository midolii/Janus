import type { LivePreviewResizeEdge } from "@janus/ui/lib/live-preview-geometry"
import type { PointerEvent as ReactPointerEvent } from "react"

interface LivePreviewResizeHandlesProps {
  onPointerDown: (edge: LivePreviewResizeEdge, event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerEnd: (event: ReactPointerEvent<HTMLButtonElement>) => void
}

const edgeHandleStyles: Record<
  Exclude<LivePreviewResizeEdge, "bottom-right">,
  { label: string; hitArea: string; indicator: string }
> = {
  left: {
    label: "从左侧调整实时截图窗口宽度",
    hitArea: "top-8 bottom-8 left-0 w-3 cursor-ew-resize",
    indicator: "top-1/2 left-1 h-10 w-1 -translate-y-1/2",
  },
  right: {
    label: "从右侧调整实时截图窗口宽度",
    hitArea: "top-8 right-0 bottom-8 w-3 cursor-ew-resize",
    indicator: "top-1/2 right-1 h-10 w-1 -translate-y-1/2",
  },
  bottom: {
    label: "从底部调整实时截图窗口高度",
    hitArea: "right-8 bottom-0 left-8 h-3 cursor-ns-resize",
    indicator: "bottom-1 left-1/2 h-1 w-10 -translate-x-1/2",
  },
}

export function LivePreviewResizeHandles({
  onPointerDown,
  onPointerMove,
  onPointerEnd,
}: LivePreviewResizeHandlesProps) {
  return (
    <>
      {(Object.keys(edgeHandleStyles) as Array<keyof typeof edgeHandleStyles>).map((edge) => {
        const styles = edgeHandleStyles[edge]
        return (
          <button
            key={edge}
            className={`group absolute z-20 touch-none focus-visible:outline-none ${styles.hitArea}`}
            type="button"
            aria-label={styles.label}
            onPointerCancel={onPointerEnd}
            onPointerDown={(event) => onPointerDown(edge, event)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
          >
            <span
              className={`pointer-events-none absolute rounded-full bg-white/82 opacity-0 shadow-[0_0_12px_rgba(255,255,255,0.38)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 ${styles.indicator}`}
              aria-hidden="true"
            />
          </button>
        )
      })}

      <button
        className="group absolute right-0 bottom-0 z-20 flex size-8 cursor-se-resize touch-none items-end justify-end rounded-tl-2xl p-1 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-[-4px]"
        type="button"
        aria-label="从右下角调整实时截图窗口大小"
        onPointerCancel={onPointerEnd}
        onPointerDown={(event) => onPointerDown("bottom-right", event)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
      >
        <span
          className="pointer-events-none size-5 rounded-br-2xl border-white/88 border-r-3 border-b-3 transition-colors group-hover:border-white"
          aria-hidden="true"
        />
      </button>
    </>
  )
}
