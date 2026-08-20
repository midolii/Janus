import {
  constrainPointToViewport,
  constrainRectToViewport,
  getInitialWindowRect,
  getLauncherPointFromWindow,
  getMinimizedRect,
  launcherPointToRatios,
  launcherRatiosToPoint,
  parsePersistedLauncherPosition,
  resizeRectFromEdge,
} from "@janus/ui/lib/live-preview-geometry"
import { describe, expect, it } from "vitest"

const desktopViewport = { x: 0, y: 0, width: 1440, height: 900 }
const launcherSize = { width: 132, height: 44 }

describe("live preview geometry", () => {
  it("keeps launcher and window geometry inside the safe viewport", () => {
    expect(constrainPointToViewport({ x: -200, y: 1200 }, launcherSize, desktopViewport)).toEqual({
      x: 16,
      y: 840,
    })
    expect(
      constrainRectToViewport({ x: 1300, y: 800, width: 496, height: 328 }, desktopViewport),
    ).toEqual({ x: 928, y: 556, width: 496, height: 328 })
  })

  it.each([
    ["top-left", { x: 16, y: 16 }, { x: 16, y: 16 }],
    ["top-right", { x: 1292, y: 16 }, { x: 928, y: 16 }],
    ["bottom-left", { x: 16, y: 840 }, { x: 16, y: 556 }],
    ["bottom-right", { x: 1292, y: 840 }, { x: 928, y: 556 }],
  ])("opens from the %s launcher corner", (_name, launcherPoint, expectedPoint) => {
    const rect = getInitialWindowRect({ ...launcherPoint, ...launcherSize }, desktopViewport)
    expect({ x: rect.x, y: rect.y }).toEqual(expectedPoint)
  })

  it.each([
    ["top-left", { x: 40, y: 50, width: 496, height: 328 }, { x: 40, y: 50 }],
    ["top-right", { x: 900, y: 50, width: 496, height: 328 }, { x: 1264, y: 50 }],
    ["bottom-left", { x: 40, y: 520, width: 496, height: 328 }, { x: 40, y: 804 }],
    ["bottom-right", { x: 900, y: 520, width: 496, height: 328 }, { x: 1264, y: 804 }],
  ])("collapses towards the %s window corner", (_name, windowRect, expectedPoint) => {
    expect(getLauncherPointFromWindow(windowRect, launcherSize, desktopViewport)).toEqual(
      expectedPoint,
    )
  })

  it("caps the minimized header width on mobile and desktop", () => {
    expect(
      getMinimizedRect(
        { x: 20, y: 20, width: 496, height: 328 },
        { x: 0, y: 0, width: 390, height: 844 },
      ),
    ).toEqual({ x: 16, y: 20, width: 358, height: 44 })
    expect(getMinimizedRect({ x: 900, y: 700, width: 496, height: 328 }, desktopViewport)).toEqual({
      x: 900,
      y: 840,
      width: 496,
      height: 44,
    })
  })

  it("does not widen a narrow resized window when minimizing", () => {
    expect(getMinimizedRect({ x: 420, y: 260, width: 344, height: 260 }, desktopViewport)).toEqual({
      x: 420,
      y: 260,
      width: 344,
      height: 44,
    })
  })

  it.each([
    ["top-left", { x: 40, y: 50, width: 700, height: 400 }, { x: 40, y: 50 }],
    ["top-right", { x: 700, y: 50, width: 700, height: 400 }, { x: 904, y: 50 }],
    ["bottom-left", { x: 40, y: 450, width: 700, height: 400 }, { x: 40, y: 806 }],
    ["bottom-right", { x: 700, y: 450, width: 700, height: 400 }, { x: 904, y: 806 }],
  ])("minimizes towards the %s window corner", (_name, windowRect, expectedPoint) => {
    const minimized = getMinimizedRect(windowRect, desktopViewport)
    expect({ x: minimized.x, y: minimized.y }).toEqual(expectedPoint)
    expect({ width: minimized.width, height: minimized.height }).toEqual({
      width: 496,
      height: 44,
    })
  })

  it("resizes from the right and bottom while keeping the top-left anchor fixed", () => {
    const origin = { x: 600, y: 400, width: 496, height: 328 }
    expect(resizeRectFromEdge(origin, "right", { x: 404, y: 200 }, desktopViewport)).toEqual({
      x: 600,
      y: 400,
      width: 824,
      height: 328,
    })
    expect(resizeRectFromEdge(origin, "bottom", { x: 300, y: 472 }, desktopViewport)).toEqual({
      x: 600,
      y: 400,
      width: 496,
      height: 484,
    })
    expect(resizeRectFromEdge(origin, "bottom-right", { x: 404, y: 472 }, desktopViewport)).toEqual(
      { x: 600, y: 400, width: 824, height: 484 },
    )
  })

  it("resizes from the left while keeping the right edge fixed", () => {
    const origin = { x: 600, y: 400, width: 496, height: 328 }
    expect(resizeRectFromEdge(origin, "left", { x: -300, y: 0 }, desktopViewport)).toEqual({
      x: 300,
      y: 400,
      width: 796,
      height: 328,
    })
    expect(resizeRectFromEdge(origin, "left", { x: 900, y: 0 }, desktopViewport)).toEqual({
      x: 776,
      y: 400,
      width: 320,
      height: 328,
    })
  })

  it("stores normalized launcher positions across viewport sizes", () => {
    const original = { x: 1292, y: 840 }
    const persisted = launcherPointToRatios(original, launcherSize, desktopViewport)
    const mobilePoint = launcherRatiosToPoint(persisted, launcherSize, {
      x: 0,
      y: 0,
      width: 390,
      height: 844,
    })

    expect(persisted).toEqual({ version: 1, xRatio: 1, yRatio: 1 })
    expect(mobilePoint).toEqual({ x: 242, y: 784 })
  })

  it("falls back safely for corrupted or out-of-range persisted values", () => {
    expect(parsePersistedLauncherPosition("not-json")).toEqual({
      version: 1,
      xRatio: 1,
      yRatio: 1,
    })
    expect(parsePersistedLauncherPosition('{"version":1,"xRatio":-3,"yRatio":9}')).toEqual({
      version: 1,
      xRatio: 0,
      yRatio: 1,
    })
  })
})
