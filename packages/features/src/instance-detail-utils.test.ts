import { describe, expect, it } from "vitest"
import {
  findLogMatches,
  formatConfigValue,
  getConfigValue,
  mergeLogTail,
  parseLogBlocks,
  reconcileLogBlockExpansion,
} from "./instance-detail-utils"

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

  it("groups separator-delimited logs and uses the first child timestamp", () => {
    const blocks = parseLogBlocks(
      [
        "INFO     09:31:05.618 │ 收尾日志",
        "──────── 大世界-侵蚀1练级检查 ────────",
        "INFO     09:31:08.686 │ 开始检查",
        "INFO     09:31:09.102 │ 检查完成",
      ],
      new Date(2026, 7, 18, 12),
    )

    expect(blocks).toHaveLength(2)
    expect(blocks[0]?.title).toBe("前序日志")
    expect(blocks[1]?.title).toBe("大世界-侵蚀1练级检查")
    expect(blocks[1]?.timestamp).toEqual(new Date(2026, 7, 18, 9, 31, 8, 686))
    expect(blocks[1]?.lines.map((line) => line.raw)).toEqual([
      "INFO     09:31:08.686 │ 开始检查",
      "INFO     09:31:09.102 │ 检查完成",
    ])
  })

  it("infers the previous date when a log tail crosses midnight", () => {
    const [block] = parseLogBlocks(
      ["INFO     23:59:59.900 │ 昨天", "INFO     00:00:00.100 │ 今天"],
      new Date(2026, 7, 18, 12),
    )

    expect(block?.lines[0]?.timestamp).toEqual(new Date(2026, 7, 17, 23, 59, 59, 900))
    expect(block?.lines[1]?.timestamp).toEqual(new Date(2026, 7, 18, 0, 0, 0, 100))
  })

  it("finds log lines case-insensitively without removing surrounding context", () => {
    const blocks = parseLogBlocks(
      ["INFO service ready", "ERROR connection lost", "INFO retrying"],
      new Date(2026, 7, 18, 12),
    )
    const matches = findLogMatches(blocks, "INFO")

    expect(matches).toHaveLength(2)
    expect(matches.map((match) => match.lineId)).toEqual([
      blocks[0]?.lines[0]?.id,
      blocks[0]?.lines[2]?.id,
    ])
    expect(findLogMatches(blocks, "  ")).toEqual([])
  })

  it("keeps session history while merging a sliding backend log tail", () => {
    const history = ["line-1", "line-2", "line-3"]

    expect(mergeLogTail(history, ["line-2", "line-3", "line-4"])).toEqual([
      "line-1",
      "line-2",
      "line-3",
      "line-4",
    ])
    expect(mergeLogTail(history, ["line-3"])).toBe(history)
    expect(mergeLogTail(history, ["service restarted"])).toEqual([
      "line-1",
      "line-2",
      "line-3",
      "service restarted",
    ])
  })

  it("keeps an observed log block expanded when a new block arrives", () => {
    const initial = reconcileLogBlockExpansion({}, ["earlier", "observed"])

    expect(initial).toEqual({ earlier: false, observed: true })
    expect(reconcileLogBlockExpansion(initial, ["earlier", "observed", "new"])).toEqual({
      earlier: false,
      observed: true,
      new: true,
    })
  })

  it("preserves an explicit collapsed choice while opening a new log block", () => {
    const current = { earlier: false, observed: false }

    expect(reconcileLogBlockExpansion(current, ["earlier", "observed", "new"])).toEqual({
      earlier: false,
      observed: false,
      new: true,
    })
    expect(reconcileLogBlockExpansion(current, ["earlier", "observed"])).toBe(current)
  })
})
