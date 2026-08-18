import { describe, expect, it } from "vitest"
import { filterLogLines, formatConfigValue, getConfigValue } from "./instance-detail-utils"

describe("instance detail utilities", () => {
  it("resolves dotted schema keys from nested config values", () => {
    const values = { Alas: { Emulator: { Serial: "127.0.0.1:5555" } } }

    expect(getConfigValue(values, "Alas.Emulator.Serial")).toBe("127.0.0.1:5555")
    expect(getConfigValue(values, "Alas.Emulator.Missing")).toBeUndefined()
  })

  it("formats common read-only config values", () => {
    expect(formatConfigValue(true)).toBe("已启用")
    expect(formatConfigValue(false)).toBe("已关闭")
    expect(formatConfigValue(null)).toBe("—")
    expect(formatConfigValue(["one", "two"])).toBe("one、two")
  })

  it("filters logs without changing the original ordering", () => {
    const lines = ["INFO service ready", "ERROR connection lost", "INFO retrying"]

    expect(filterLogLines(lines, "info")).toEqual([lines[0], lines[2]])
    expect(filterLogLines(lines, "  ")).toBe(lines)
  })
})
