import { describe, expect, it } from "vitest"
import { isInstanceDetailTab } from "./instance-detail-tabs"

describe("instance detail tabs", () => {
  it("accepts route-safe tab names and rejects display labels", () => {
    expect(isInstanceDetailTab("overview")).toBe(true)
    expect(isInstanceDetailTab("tasks")).toBe(true)
    expect(isInstanceDetailTab("config")).toBe(true)
    expect(isInstanceDetailTab("logs")).toBe(true)
    expect(isInstanceDetailTab("概览")).toBe(false)
    expect(isInstanceDetailTab("unknown")).toBe(false)
  })
})
