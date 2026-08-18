"use client"

import { cn } from "@janus/ui/lib/utils"
import { GripHorizontal, Maximize2, Minimize2, Minus, MonitorPlay, X } from "lucide-react"
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react"
import { type PointerEvent, type ReactNode, useRef } from "react"

export type LivePreviewStatusTone = "neutral" | "success" | "warning" | "danger"

export interface LivePreviewWindowProps {
  open: boolean
  minimized: boolean
  maximized: boolean
  title: string
  statusLabel: string
  statusTone?: LivePreviewStatusTone
  launcherLabel?: string
  launcherDisabled?: boolean
  headerControls?: ReactNode
  children: ReactNode
  onOpen: () => void
  onClose: () => void
  onToggleMinimized: () => void
  onToggleMaximized: () => void
}

export function LivePreviewWindow({
  open,
  minimized,
  maximized,
  title,
  statusLabel,
  statusTone = "neutral",
  launcherLabel = "实时截图",
  launcherDisabled = false,
  headerControls,
  children,
  onOpen,
  onClose,
  onToggleMinimized,
  onToggleMaximized,
}: LivePreviewWindowProps) {
  const dragControls = useDragControls()
  const reduceMotion = useReducedMotion()
  const viewportRef = useRef<HTMLDivElement>(null)

  function startDragging(event: PointerEvent<HTMLElement>) {
    if (!maximized && event.button === 0) {
      dragControls.start(event)
    }
  }

  return (
    <AnimatePresence initial={false}>
      {!open ? (
        <motion.button
          key="live-preview-launcher"
          className="fixed right-5 bottom-5 z-50 flex min-h-11 items-center gap-2 rounded-full border border-white/75 bg-slate-950 px-4 font-medium text-white text-xs shadow-[0_16px_42px_-18px_rgba(15,23,42,0.78)] transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45 sm:right-7 sm:bottom-7"
          type="button"
          disabled={launcherDisabled}
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          onClick={onOpen}
        >
          <MonitorPlay className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{launcherLabel}</span>
        </motion.button>
      ) : (
        <motion.div
          key="live-preview-viewport"
          ref={viewportRef}
          className="pointer-events-none fixed inset-0 z-50"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          {/* 最大化只改变窗口布局；保持节点身份稳定，避免卸载媒体画面并重建 WebSocket。 */}
          <motion.section
            className={cn(
              "pointer-events-auto absolute flex min-h-12 flex-col overflow-hidden border border-white/16 bg-slate-950 text-white shadow-[0_30px_90px_-30px_rgba(15,23,42,0.9)] ring-1 ring-black/15 backdrop-blur-3xl",
              maximized
                ? "inset-3 rounded-[1.6rem] sm:inset-6"
                : minimized
                  ? "right-4 bottom-4 h-12 w-[min(31rem,calc(100vw-2rem))] resize-none rounded-[1.45rem] sm:right-7 sm:bottom-7"
                  : "right-4 bottom-4 h-82 max-h-[calc(100dvh-2rem)] w-[min(31rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] resize rounded-[1.45rem] sm:right-7 sm:bottom-7 sm:min-h-60 sm:min-w-80",
            )}
            role="region"
            aria-label={title}
            drag={!maximized}
            dragConstraints={viewportRef}
            dragControls={dragControls}
            dragElastic={0}
            dragListener={false}
            dragMomentum={false}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <header
              className={cn(
                "flex min-h-12 shrink-0 select-none items-center gap-2 border-white/10 border-b bg-white/6 px-3 backdrop-blur-2xl",
                !maximized && "cursor-grab active:cursor-grabbing",
              )}
              onPointerDown={startDragging}
            >
              <GripHorizontal className="size-4 shrink-0 text-white/35" aria-hidden="true" />
              <h2
                className="min-w-0 flex-1 truncate whitespace-nowrap font-medium text-sm"
                title={title}
              >
                {title}
              </h2>
              <div
                className="flex shrink-0 items-center gap-0.5"
                onPointerDown={(event) => event.stopPropagation()}
              >
                {headerControls}
                <WindowButton
                  label={minimized ? "恢复实时截图" : "最小化实时截图"}
                  onClick={onToggleMinimized}
                >
                  <Minus className="size-3.5" />
                </WindowButton>
                <WindowButton
                  label={maximized ? "恢复浮窗" : "最大化实时截图"}
                  onClick={onToggleMaximized}
                >
                  {maximized ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )}
                </WindowButton>
                <WindowButton label="关闭实时截图" onClick={onClose}>
                  <X className="size-4" />
                </WindowButton>
              </div>
            </header>

            <div
              className={cn(
                "relative min-h-0 flex-1 overflow-hidden bg-black",
                minimized && !maximized && "pointer-events-none h-0 flex-none opacity-0",
              )}
              aria-hidden={minimized && !maximized}
            >
              {children}
              <div
                className="pointer-events-none absolute right-3 bottom-3 left-3 z-10 flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-black/58 px-3 py-1.5 text-[0.68rem] text-white/72 shadow-lg backdrop-blur-xl"
                title={statusLabel}
                aria-live="polite"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    statusTone === "success" && "bg-emerald-400",
                    statusTone === "warning" && "bg-amber-400",
                    statusTone === "danger" && "bg-red-400",
                    statusTone === "neutral" && "bg-slate-400",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate whitespace-nowrap">{statusLabel}</span>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function WindowButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className="flex size-7 items-center justify-center rounded-full text-white/62 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
