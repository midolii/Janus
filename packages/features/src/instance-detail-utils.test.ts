import { describe, expect, it } from "vitest"
import {
  findLogMatches,
  formatConfigValue,
  getConfigValue,
  mergeLogEntryTail,
  mergeLogTail,
  parseLogBlocks,
  parseLogSections,
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

  it("groups level-zero task banners around their nested log blocks", () => {
    const sections = parseLogSections(
      [
        "INFO     11:36:19.498 │ 调度器准备完成",
        "════════════════════════════════",
        "              MAIN              ",
        "════════════════════════════════",
        "──────── CAMPAIGN_15_4 ────────",
        "INFO     2026-08-18 11:36:19.633 │ CAMPAIGN_15_4",
        "WARNING  2026-08-18 11:36:19.654 │ [战役-运行] 次数: 0",
      ],
      new Date(2026, 7, 18, 12),
    )

    expect(sections).toHaveLength(2)
    expect(sections[0]?.explicit).toBe(false)
    expect(sections[1]?.title).toBe("MAIN")
    expect(sections[1]?.explicit).toBe(true)
    expect(sections[1]?.blocks[0]?.title).toBe("CAMPAIGN_15_4")
    expect(sections[1]?.blocks[0]?.lines[1]).toMatchObject({
      level: "warning",
      dateText: "2026-08-18",
      timeText: "11:36:19.654",
      message: "[战役-运行] 次数: 0",
    })
  })

  it("keeps level-three headings inline while recognizing file fallback log levels", () => {
    const blocks = parseLogBlocks(
      [
        "──────── 大世界 ────────",
        "INFO     09:31:08.686 │ <<< UI 确保页面 >>>",
        "2026-08-18 09:31:09.102 | ERROR | [设备] 页面超时",
      ],
      new Date(2026, 7, 18, 12),
    )

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.title).toBe("大世界")
    expect(blocks[0]?.hierarchyLevel).toBe(2)
    expect(blocks[0]?.lines[0]).toMatchObject({
      kind: "substage",
      message: "UI 确保页面",
    })
    expect(blocks[0]?.lines[1]).toMatchObject({
      level: "error",
      timeText: "09:31:09.102",
      message: "[设备] 页面超时",
    })
  })

  it("does not split repeated level-three substages into separate blocks", () => {
    const blocks = parseLogBlocks([
      "════════ 舰队操作 ════════",
      "INFO     09:31:08.686 │ <<< 等待摄像机稳定 >>>",
      "INFO     09:31:09.102 │ 已稳定",
      "INFO     09:31:10.000 │ <<< 舰队设置为 2 >>>",
      "INFO     09:31:10.200 │ 设置完成",
    ])

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.hierarchyLevel).toBe(1)
    expect(blocks[0]?.lines.filter((line) => line.kind === "substage")).toHaveLength(2)
  })

  it("prefers API epoch timestamps and ignores ANSI while parsing structure", () => {
    const timestampMs = Date.UTC(2026, 7, 18, 3, 36, 19, 654)
    const [block] = parseLogBlocks([
      {
        content: "\u001b[36mINFO     2026-08-18 11:36:19.654 │ [任务] 完成\u001b[0m",
        timestampMs,
      },
    ])

    expect(block?.lines[0]?.raw).toBe("INFO     2026-08-18 11:36:19.654 │ [任务] 完成")
    expect(block?.lines[0]?.timestamp?.getTime()).toBe(timestampMs)
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

  it("merges structured log entries by content and timestamp", () => {
    const first = { content: "same", timestampMs: 1 }
    const second = { content: "same", timestampMs: 2 }
    const third = { content: "next", timestampMs: 3 }

    expect(mergeLogEntryTail([first, second], [second, third])).toEqual([first, second, third])
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
