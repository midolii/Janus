"use client"

import { cn } from "@janus/ui/lib/utils"
import { GripHorizontal, Maximize2, Minimize2, Minus, MonitorPlay, Plus, X } from "lucide-react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react"
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  constrainPointToViewport,
  constrainRectToViewport,
  getFullscreenRect,
  getInitialWindowRect,
  getLauncherPointFromWindow,
  getMinimizedRect,
  type LivePreviewPoint,
  type LivePreviewRect,
  type LivePreviewResizeEdge,
  type LivePreviewSize,
  type LivePreviewViewport,
  launcherPointToRatios,
  launcherRatiosToPoint,
  parsePersistedLauncherPosition,
  resizeRectFromEdge,
} from "../lib/live-preview-geometry"
import { LivePreviewResizeHandles } from "./live-preview-resize-handles"

export type { LivePreviewRect } from "../lib/live-preview-geometry"

const DEFAULT_LAUNCHER_SIZE: LivePreviewSize = { width: 132, height: 44 }
const DEFAULT_LAUNCHER_STORAGE_KEY = "janus.live-preview.launcher-position"
const DRAG_ACTIVATION_DISTANCE = 4

export type LivePreviewMode = "closed" | "windowed" | "minimized" | "fullscreen"
export type LivePreviewStatusTone = "neutral" | "success" | "warning" | "danger"

export interface LivePreviewWindowProps {
  mode: LivePreviewMode
  title: string
  statusLabel: string
  statusTone?: LivePreviewStatusTone
  launcherLabel?: string
  launcherDisabled?: boolean
  launcherStorageKey?: string
  headerControls?: ReactNode
  children: ReactNode
  onModeChange: (mode: LivePreviewMode) => void
}

interface PointerGesture {
  pointerId: number
  start: LivePreviewPoint
  origin: LivePreviewRect
  moved: boolean
}

interface ResizeGesture extends PointerGesture {
  edge: LivePreviewResizeEdge
}

export function LivePreviewWindow({
  mode,
  title,
  statusLabel,
  statusTone = "neutral",
  launcherLabel = "实时截图",
  launcherDisabled = false,
  launcherStorageKey = DEFAULT_LAUNCHER_STORAGE_KEY,
  headerControls,
  children,
  onModeChange,
}: LivePreviewWindowProps) {
  const reduceMotion = useReducedMotion()
  const viewport = useVisualViewport()
  const launcherObserverRef = useRef<ResizeObserver | null>(null)
  const [launcherSize, setLauncherSize] = useState<LivePreviewSize>(DEFAULT_LAUNCHER_SIZE)
  const [launcherReady, setLauncherReady] = useState(false)
  const windowX = useMotionValue(0)
  const windowY = useMotionValue(0)
  const windowWidth = useMotionValue(DEFAULT_LAUNCHER_SIZE.width)
  const windowHeight = useMotionValue(DEFAULT_LAUNCHER_SIZE.height)
  const launcherGestureRef = useRef<PointerGesture | null>(null)
  const windowDragGestureRef = useRef<PointerGesture | null>(null)
  const resizeGestureRef = useRef<ResizeGesture | null>(null)
  const suppressLauncherClickRef = useRef(false)
  const launcherPointRef = useRef<LivePreviewPoint | null>(null)
  const windowedRectRef = useRef<LivePreviewRect | null>(null)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const modeBeforeFullscreenRef =
    useRef<Exclude<LivePreviewMode, "closed" | "fullscreen">>("windowed")

  const readWindowRect = useCallback(
    (): LivePreviewRect => ({
      x: windowX.get(),
      y: windowY.get(),
      width: windowWidth.get(),
      height: windowHeight.get(),
    }),
    [windowHeight, windowWidth, windowX, windowY],
  )

  const setWindowRect = useCallback(
    (rect: LivePreviewRect) => {
      windowX.set(rect.x)
      windowY.set(rect.y)
      windowWidth.set(rect.width)
      windowHeight.set(rect.height)
    },
    [windowHeight, windowWidth, windowX, windowY],
  )

  const getLauncherRect = useCallback((): LivePreviewRect | null => {
    if (!viewport) {
      return null
    }

    const size =
      launcherSize.width > 0 && launcherSize.height > 0 ? launcherSize : DEFAULT_LAUNCHER_SIZE
    const fallbackPoint = launcherRatiosToPoint(
      { version: 1, xRatio: 1, yRatio: 1 },
      size,
      viewport,
    )
    return { ...(launcherPointRef.current ?? fallbackPoint), ...size }
  }, [launcherSize, viewport])

  const setLauncherElement = useCallback((launcher: HTMLButtonElement | null) => {
    launcherObserverRef.current?.disconnect()
    launcherObserverRef.current = null
    if (!launcher) {
      return
    }
    const launcherElement = launcher

    function measureLauncher() {
      const bounds = launcherElement.getBoundingClientRect()
      if (bounds.width <= 0 || bounds.height <= 0) {
        return
      }
      setLauncherSize((current) =>
        current.width === bounds.width && current.height === bounds.height
          ? current
          : { width: bounds.width, height: bounds.height },
      )
    }

    measureLauncher()
    if (typeof ResizeObserver === "undefined") {
      return
    }
    const observer = new ResizeObserver(measureLauncher)
    observer.observe(launcherElement)
    launcherObserverRef.current = observer
  }, [])

  useEffect(() => () => launcherObserverRef.current?.disconnect(), [])

  useEffect(() => {
    if (!viewport) {
      return
    }

    let persisted = { version: 1 as const, xRatio: 1, yRatio: 1 }
    try {
      persisted = parsePersistedLauncherPosition(localStorage.getItem(launcherStorageKey))
    } catch {
      // Storage can be unavailable in hardened or private browser contexts.
    }
    const point = launcherRatiosToPoint(persisted, launcherSize, viewport)
    launcherPointRef.current = point
    if (modeRef.current === "closed") {
      setWindowRect({ ...point, ...launcherSize })
    }
    setLauncherReady(true)
  }, [launcherSize, launcherStorageKey, setWindowRect, viewport])

  useEffect(() => {
    if (!viewport) {
      return
    }

    const launcher = getLauncherRect()
    const fallbackWindow = launcher
      ? getInitialWindowRect(launcher, viewport)
      : getFullscreenRect(viewport)
    let target: LivePreviewRect

    if (mode === "closed") {
      target = launcher ?? { ...viewport, width: launcherSize.width, height: launcherSize.height }
    } else if (mode === "fullscreen") {
      target = getFullscreenRect(viewport)
    } else if (mode === "minimized") {
      const restoredWindow = windowedRectRef.current ?? fallbackWindow
      target = getMinimizedRect(restoredWindow, viewport)
    } else {
      target = constrainRectToViewport(windowedRectRef.current ?? fallbackWindow, viewport)
      windowedRectRef.current = target
    }

    const options = {
      duration: reduceMotion ? 0 : 0.3,
      ease: [0.32, 0.72, 0, 1] as const,
    }
    const animations = [
      animate(windowX, target.x, options),
      animate(windowY, target.y, options),
      animate(windowWidth, target.width, options),
      animate(windowHeight, target.height, options),
    ]
    return () => {
      for (const animation of animations) {
        animation.stop()
      }
    }
  }, [
    getLauncherRect,
    launcherSize.height,
    launcherSize.width,
    mode,
    reduceMotion,
    viewport,
    windowHeight,
    windowWidth,
    windowX,
    windowY,
  ])

  useEffect(() => {
    if (mode !== "fullscreen") {
      return
    }

    function exitOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onModeChange(modeBeforeFullscreenRef.current)
      }
    }

    window.addEventListener("keydown", exitOnEscape)
    return () => window.removeEventListener("keydown", exitOnEscape)
  }, [mode, onModeChange])

  function persistLauncherPoint(point: LivePreviewPoint) {
    if (!viewport) {
      return
    }
    try {
      localStorage.setItem(
        launcherStorageKey,
        JSON.stringify(launcherPointToRatios(point, launcherSize, viewport)),
      )
    } catch {
      // The launcher still works for this session when persistence is unavailable.
    }
  }

  function openWindow() {
    if (launcherDisabled || !viewport) {
      return
    }
    const launcher = getLauncherRect()
    if (!launcher) {
      return
    }
    const target = getInitialWindowRect(launcher, viewport)
    windowedRectRef.current = target
    onModeChange("windowed")
  }

  function closeWindow() {
    if (viewport) {
      const launcherPoint = getLauncherPointFromWindow(readWindowRect(), launcherSize, viewport)
      launcherPointRef.current = launcherPoint
      persistLauncherPoint(launcherPoint)
    }
    windowedRectRef.current = null
    onModeChange("closed")
  }

  function toggleMinimized() {
    if (mode === "minimized") {
      onModeChange("windowed")
      return
    }
    const current = readWindowRect()
    windowedRectRef.current = viewport ? constrainRectToViewport(current, viewport) : current
    onModeChange("minimized")
  }

  function enterFullscreen() {
    if (mode === "windowed") {
      windowedRectRef.current = readWindowRect()
    }
    if (mode === "windowed" || mode === "minimized") {
      modeBeforeFullscreenRef.current = mode
    }
    onModeChange("fullscreen")
  }

  function exitFullscreen() {
    onModeChange(modeBeforeFullscreenRef.current)
  }

  function startLauncherDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (launcherDisabled || event.button !== 0) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    launcherGestureRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: readWindowRect(),
      moved: false,
    }
    suppressLauncherClickRef.current = false
  }

  function dragLauncher(event: ReactPointerEvent<HTMLButtonElement>) {
    const gesture = launcherGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId || !viewport) {
      return
    }
    const deltaX = event.clientX - gesture.start.x
    const deltaY = event.clientY - gesture.start.y
    if (Math.hypot(deltaX, deltaY) >= DRAG_ACTIVATION_DISTANCE) {
      gesture.moved = true
      suppressLauncherClickRef.current = true
    }
    const point = constrainPointToViewport(
      { x: gesture.origin.x + deltaX, y: gesture.origin.y + deltaY },
      launcherSize,
      viewport,
    )
    windowX.set(point.x)
    windowY.set(point.y)
  }

  function finishLauncherDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const gesture = launcherGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    launcherGestureRef.current = null
    if (gesture.moved) {
      const point = { x: windowX.get(), y: windowY.get() }
      launcherPointRef.current = point
      persistLauncherPoint(point)
    }
  }

  function startWindowDrag(event: ReactPointerEvent<HTMLElement>) {
    if (mode === "fullscreen" || event.button !== 0) {
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    windowDragGestureRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: readWindowRect(),
      moved: false,
    }
  }

  function dragWindow(event: ReactPointerEvent<HTMLElement>) {
    const gesture = windowDragGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId || !viewport) {
      return
    }
    const point = constrainPointToViewport(
      {
        x: gesture.origin.x + event.clientX - gesture.start.x,
        y: gesture.origin.y + event.clientY - gesture.start.y,
      },
      gesture.origin,
      viewport,
    )
    windowX.set(point.x)
    windowY.set(point.y)
  }

  function finishWindowDrag(event: ReactPointerEvent<HTMLElement>) {
    const gesture = windowDragGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    windowDragGestureRef.current = null
    const current = readWindowRect()
    if (mode === "windowed") {
      windowedRectRef.current = current
    } else if (mode === "minimized" && windowedRectRef.current) {
      // A dragged minimized header restores from the corresponding viewport
      // corner instead of silently switching back to a top-left anchor.
      windowedRectRef.current = viewport
        ? getInitialWindowRect(current, viewport, windowedRectRef.current)
        : { ...windowedRectRef.current, x: current.x, y: current.y }
    }
  }

  function startResize(edge: LivePreviewResizeEdge, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeGestureRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: readWindowRect(),
      moved: false,
      edge,
    }
  }

  function resizeWindow(event: ReactPointerEvent<HTMLButtonElement>) {
    const gesture = resizeGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId || !viewport) {
      return
    }
    const rect = resizeRectFromEdge(
      gesture.origin,
      gesture.edge,
      { x: event.clientX - gesture.start.x, y: event.clientY - gesture.start.y },
      viewport,
    )
    setWindowRect(rect)
  }

  function finishResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const gesture = resizeGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    resizeGestureRef.current = null
    windowedRectRef.current = readWindowRect()
  }

  const minimized = mode === "minimized"
  const fullscreen = mode === "fullscreen"
  const closed = mode === "closed"

  return (
    <motion.section
      className={cn(
        "fixed top-0 left-0 z-50 flex origin-top-left flex-col overflow-hidden bg-slate-950 text-white",
        closed && "border border-white/75 shadow-[0_16px_42px_-18px_rgba(15,23,42,0.78)]",
        fullscreen && "border-0 shadow-none ring-0",
        !closed &&
          !fullscreen &&
          "min-h-11 border border-white/16 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.9)] ring-1 ring-black/15 backdrop-blur-3xl",
      )}
      role={closed ? undefined : "region"}
      aria-label={closed ? undefined : title}
      style={{ x: windowX, y: windowY, width: windowWidth, height: windowHeight }}
      initial={false}
      animate={{
        // 22px is already a complete pill at the 44px launcher height. Keeping
        // the same real radius while expanding avoids Motion interpolating from
        // an artificial 999px value and briefly producing a giant capsule.
        borderRadius: fullscreen ? 0 : 22,
        opacity: closed && !launcherReady ? 0 : 1,
        scale: 1,
      }}
      transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      {closed ? (
        <motion.button
          ref={setLauncherElement}
          className="flex h-11 min-h-11 w-max max-w-[calc(100vw-2rem)] touch-none items-center gap-2 bg-slate-950 px-4 font-medium text-white text-xs transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-3px] disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          aria-label={launcherLabel}
          disabled={launcherDisabled}
          onClick={() => {
            if (suppressLauncherClickRef.current) {
              suppressLauncherClickRef.current = false
              return
            }
            openWindow()
          }}
          onPointerCancel={finishLauncherDrag}
          onPointerDown={startLauncherDrag}
          onPointerMove={dragLauncher}
          onPointerUp={finishLauncherDrag}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.12, delay: reduceMotion ? 0 : 0.16 }}
        >
          <MonitorPlay className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{launcherLabel}</span>
        </motion.button>
      ) : (
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.16, delay: reduceMotion ? 0 : 0.07 }}
        >
          {fullscreen ? null : (
            <header
              className="flex h-11 shrink-0 cursor-grab touch-none select-none items-center gap-2 border-white/10 border-b bg-white/6 px-3 backdrop-blur-2xl active:cursor-grabbing"
              onPointerCancel={finishWindowDrag}
              onPointerDown={startWindowDrag}
              onPointerMove={dragWindow}
              onPointerUp={finishWindowDrag}
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
                  onClick={toggleMinimized}
                >
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      key={minimized ? "restore" : "minimize"}
                      className="flex items-center justify-center"
                      initial={reduceMotion ? false : { opacity: 0, rotate: -45, scale: 0.65 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.65 }}
                      transition={{ duration: reduceMotion ? 0 : 0.14 }}
                    >
                      {minimized ? (
                        <Plus className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Minus className="size-3.5" aria-hidden="true" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </WindowButton>
                <WindowButton label="全屏显示实时截图" onClick={enterFullscreen}>
                  <Maximize2 className="size-3.5" aria-hidden="true" />
                </WindowButton>
                <WindowButton label="关闭实时截图" onClick={closeWindow}>
                  <X className="size-4" aria-hidden="true" />
                </WindowButton>
              </div>
            </header>
          )}

          <motion.div
            className="relative min-h-0 flex-1 overflow-hidden bg-black"
            aria-hidden={minimized}
            animate={{ opacity: minimized ? 0 : 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.14 }}
          >
            {children}
            {minimized ? null : (
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
            )}
          </motion.div>

          {mode === "windowed" ? (
            <LivePreviewResizeHandles
              onPointerDown={startResize}
              onPointerMove={resizeWindow}
              onPointerEnd={finishResize}
            />
          ) : null}

          <AnimatePresence>
            {fullscreen ? (
              <motion.button
                key="exit-fullscreen"
                className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-20 flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-black/62 px-3.5 font-medium text-white text-xs shadow-xl backdrop-blur-xl hover:bg-black/78 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
                type="button"
                aria-label="退出全屏"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.86 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
                onClick={exitFullscreen}
              >
                <Minimize2 className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">退出全屏</span>
              </motion.button>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.section>
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

function useVisualViewport(): LivePreviewViewport | null {
  const [viewport, setViewport] = useState<LivePreviewViewport | null>(null)

  useEffect(() => {
    function syncViewport() {
      const visualViewport = window.visualViewport
      const next = {
        x: visualViewport?.offsetLeft ?? 0,
        y: visualViewport?.offsetTop ?? 0,
        width: visualViewport?.width ?? window.innerWidth,
        height: visualViewport?.height ?? window.innerHeight,
      }
      setViewport((current) =>
        current &&
        current.x === next.x &&
        current.y === next.y &&
        current.width === next.width &&
        current.height === next.height
          ? current
          : next,
      )
    }

    syncViewport()
    window.addEventListener("resize", syncViewport, { passive: true })
    window.visualViewport?.addEventListener("resize", syncViewport, { passive: true })
    window.visualViewport?.addEventListener("scroll", syncViewport, { passive: true })
    return () => {
      window.removeEventListener("resize", syncViewport)
      window.visualViewport?.removeEventListener("resize", syncViewport)
      window.visualViewport?.removeEventListener("scroll", syncViewport)
    }
  }, [])

  return viewport
}
