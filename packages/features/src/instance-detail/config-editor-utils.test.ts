import { describe, expect, it } from "vitest"
import {
  buildConfigPatchRequest,
  formatConfigDateTimeInput,
  getEffectiveConfigValue,
  isSameConfigOptionValue,
  normalizeConfigDateTimeInput,
  updateConfigChanges,
} from "./config-editor-utils"

describe("config editor utilities", () => {
  it("only sends explicitly changed paths", () => {
    expect(
      buildConfigPatchRequest("revision", {
        "Alas.Emulator.Serial": "auto",
        "Scheduler.Scheduler.Enable": false,
      }),
    ).toEqual({
      expectedRevision: "revision",
      changes: [
        { path: "Alas.Emulator.Serial", value: "auto" },
        { path: "Scheduler.Scheduler.Enable", value: false },
      ],
    })
  })

  it("preserves explicit false and empty values", () => {
    expect(getEffectiveConfigValue({ enabled: false }, "enabled", true)).toBe(false)
    expect(getEffectiveConfigValue({ value: "" }, "value", "original")).toBe("")
  })

  it("removes a pending change when the original value is restored", () => {
    expect(updateConfigChanges({ enabled: false }, "enabled", true, true)).toEqual({})
    expect(updateConfigChanges({}, "priorities", ["A", "B"], ["A", "B"])).toEqual({})
  })
})

describe("config editor representations", () => {
  it("matches JSON number options with string config values", () => {
    expect(isSameConfigOptionValue(2, "2")).toBe(true)
    expect(isSameConfigOptionValue(false, "false")).toBe(false)
  })

  it("shows a readable datetime while preserving the API format", () => {
    expect(formatConfigDateTimeInput("2026-08-27T00:00:00")).toBe("2026-08-27 00:00:00")
    expect(normalizeConfigDateTimeInput("2026-08-27 00:00:00")).toBe("2026-08-27T00:00:00")
  })
})
