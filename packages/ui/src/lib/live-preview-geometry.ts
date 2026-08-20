export const LIVE_PREVIEW_GUTTER = 16
export const LIVE_PREVIEW_HEADER_HEIGHT = 44
export const LIVE_PREVIEW_MINIMIZED_MAX_WIDTH = 496
export const LIVE_PREVIEW_DEFAULT_SIZE: LivePreviewSize = { width: 496, height: 328 }
export const LIVE_PREVIEW_MIN_SIZE: LivePreviewSize = { width: 320, height: 240 }

export interface LivePreviewPoint {
  x: number
  y: number
}

export interface LivePreviewSize {
  width: number
  height: number
}

export interface LivePreviewRect extends LivePreviewPoint, LivePreviewSize {}

export interface LivePreviewViewport extends LivePreviewRect {}

export type LivePreviewResizeEdge = "left" | "right" | "bottom" | "bottom-right"

export interface PersistedLauncherPosition {
  version: 1
  xRatio: number
  yRatio: number
}

export function clampValue(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

export function constrainPointToViewport(
  point: LivePreviewPoint,
  size: LivePreviewSize,
  viewport: LivePreviewViewport,
  gutter = LIVE_PREVIEW_GUTTER,
): LivePreviewPoint {
  const bounds = getPointBounds(size, viewport, gutter)
  return {
    x: clampValue(point.x, bounds.minimum.x, bounds.maximum.x),
    y: clampValue(point.y, bounds.minimum.y, bounds.maximum.y),
  }
}

export function constrainRectToViewport(
  rect: LivePreviewRect,
  viewport: LivePreviewViewport,
  gutter = LIVE_PREVIEW_GUTTER,
): LivePreviewRect {
  const availableWidth = Math.max(0, viewport.width - gutter * 2)
  const availableHeight = Math.max(0, viewport.height - gutter * 2)
  const size = {
    width: Math.min(rect.width, availableWidth),
    height: Math.min(rect.height, availableHeight),
  }
  return {
    ...constrainPointToViewport(rect, size, viewport, gutter),
    ...size,
  }
}

export function getInitialWindowRect(
  launcher: LivePreviewRect,
  viewport: LivePreviewViewport,
  preferredSize = LIVE_PREVIEW_DEFAULT_SIZE,
): LivePreviewRect {
  const availableWidth = Math.max(0, viewport.width - LIVE_PREVIEW_GUTTER * 2)
  const availableHeight = Math.max(0, viewport.height - LIVE_PREVIEW_GUTTER * 2)
  const width = Math.min(preferredSize.width, availableWidth)
  const height = Math.min(preferredSize.height, availableHeight)
  const { alignRight, alignBottom } = getViewportCornerAlignment(launcher, viewport)
  const x = alignRight ? launcher.x + launcher.width - width : launcher.x
  const y = alignBottom ? launcher.y + launcher.height - height : launcher.y

  return constrainRectToViewport({ x, y, width, height }, viewport)
}

/**
 * Returns the launcher position at the window corner nearest the viewport corner
 * containing the window centre. This makes closing and reopening use the same
 * four-quadrant origin instead of always collapsing towards the top-left.
 */
export function getLauncherPointFromWindow(
  windowRect: LivePreviewRect,
  launcherSize: LivePreviewSize,
  viewport: LivePreviewViewport,
): LivePreviewPoint {
  const { alignRight, alignBottom } = getViewportCornerAlignment(windowRect, viewport)

  return constrainPointToViewport(
    {
      x: alignRight ? windowRect.x + windowRect.width - launcherSize.width : windowRect.x,
      y: alignBottom ? windowRect.y + windowRect.height - launcherSize.height : windowRect.y,
    },
    launcherSize,
    viewport,
  )
}

export function getMinimizedRect(
  windowRect: LivePreviewRect,
  viewport: LivePreviewViewport,
): LivePreviewRect {
  const width = Math.min(
    windowRect.width,
    LIVE_PREVIEW_MINIMIZED_MAX_WIDTH,
    Math.max(0, viewport.width - LIVE_PREVIEW_GUTTER * 2),
  )
  const height = Math.min(
    LIVE_PREVIEW_HEADER_HEIGHT,
    Math.max(0, viewport.height - LIVE_PREVIEW_GUTTER * 2),
  )
  const { alignRight, alignBottom } = getViewportCornerAlignment(windowRect, viewport)
  return constrainRectToViewport(
    {
      x: alignRight ? windowRect.x + windowRect.width - width : windowRect.x,
      y: alignBottom ? windowRect.y + windowRect.height - height : windowRect.y,
      width,
      height,
    },
    viewport,
  )
}

export function getFullscreenRect(viewport: LivePreviewViewport): LivePreviewRect {
  return { ...viewport }
}

export function resizeRectFromEdge(
  rect: LivePreviewRect,
  edge: LivePreviewResizeEdge,
  delta: LivePreviewPoint,
  viewport: LivePreviewViewport,
  minimumSize = LIVE_PREVIEW_MIN_SIZE,
): LivePreviewRect {
  const maximumWidth = Math.max(0, viewport.x + viewport.width - LIVE_PREVIEW_GUTTER - rect.x)
  const maximumHeight = Math.max(0, viewport.y + viewport.height - LIVE_PREVIEW_GUTTER - rect.y)
  const minimumWidth = Math.min(minimumSize.width, maximumWidth)
  const minimumHeight = Math.min(minimumSize.height, maximumHeight)
  const resizeLeft = edge === "left"
  const resizeRight = edge === "right" || edge === "bottom-right"
  const resizeBottom = edge === "bottom" || edge === "bottom-right"

  if (resizeLeft) {
    const fixedRight = rect.x + rect.width
    const minimumX = viewport.x + LIVE_PREVIEW_GUTTER
    const maximumX = Math.max(minimumX, fixedRight - minimumSize.width)
    const x = clampValue(rect.x + delta.x, minimumX, maximumX)
    return { ...rect, x, width: fixedRight - x }
  }

  return {
    ...rect,
    width: resizeRight ? clampValue(rect.width + delta.x, minimumWidth, maximumWidth) : rect.width,
    height: resizeBottom
      ? clampValue(rect.height + delta.y, minimumHeight, maximumHeight)
      : rect.height,
  }
}

export function launcherPointToRatios(
  point: LivePreviewPoint,
  size: LivePreviewSize,
  viewport: LivePreviewViewport,
): PersistedLauncherPosition {
  const bounds = getPointBounds(size, viewport, LIVE_PREVIEW_GUTTER)
  const xTravel = bounds.maximum.x - bounds.minimum.x
  const yTravel = bounds.maximum.y - bounds.minimum.y
  return {
    version: 1,
    xRatio: xTravel > 0 ? clampValue((point.x - bounds.minimum.x) / xTravel, 0, 1) : 0,
    yRatio: yTravel > 0 ? clampValue((point.y - bounds.minimum.y) / yTravel, 0, 1) : 0,
  }
}

export function launcherRatiosToPoint(
  position: PersistedLauncherPosition,
  size: LivePreviewSize,
  viewport: LivePreviewViewport,
): LivePreviewPoint {
  const bounds = getPointBounds(size, viewport, LIVE_PREVIEW_GUTTER)
  return {
    x: bounds.minimum.x + (bounds.maximum.x - bounds.minimum.x) * clampValue(position.xRatio, 0, 1),
    y: bounds.minimum.y + (bounds.maximum.y - bounds.minimum.y) * clampValue(position.yRatio, 0, 1),
  }
}

export function parsePersistedLauncherPosition(value: string | null): PersistedLauncherPosition {
  if (!value) {
    return { version: 1, xRatio: 1, yRatio: 1 }
  }

  try {
    const parsed: unknown = JSON.parse(value)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      parsed.version === 1 &&
      "xRatio" in parsed &&
      typeof parsed.xRatio === "number" &&
      Number.isFinite(parsed.xRatio) &&
      "yRatio" in parsed &&
      typeof parsed.yRatio === "number" &&
      Number.isFinite(parsed.yRatio)
    ) {
      return {
        version: 1,
        xRatio: clampValue(parsed.xRatio, 0, 1),
        yRatio: clampValue(parsed.yRatio, 0, 1),
      }
    }
  } catch {
    // Ignore stale or manually edited storage and return the safe bottom-right default.
  }

  return { version: 1, xRatio: 1, yRatio: 1 }
}

function getPointBounds(
  size: LivePreviewSize,
  viewport: LivePreviewViewport,
  gutter: number,
): { minimum: LivePreviewPoint; maximum: LivePreviewPoint } {
  const minimum = {
    x: viewport.x + gutter,
    y: viewport.y + gutter,
  }
  return {
    minimum,
    maximum: {
      x: Math.max(minimum.x, viewport.x + viewport.width - size.width - gutter),
      y: Math.max(minimum.y, viewport.y + viewport.height - size.height - gutter),
    },
  }
}

function getViewportCornerAlignment(
  rect: LivePreviewRect,
  viewport: LivePreviewViewport,
): { alignRight: boolean; alignBottom: boolean } {
  return {
    alignRight: rect.x + rect.width / 2 > viewport.x + viewport.width / 2,
    alignBottom: rect.y + rect.height / 2 > viewport.y + viewport.height / 2,
  }
}
