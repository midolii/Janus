export function getConfigValue(values: Record<string, unknown>, path: string): unknown {
  // Schema keys use dotted paths while the config endpoint returns nested objects.
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined
    }

    return (current as Record<string, unknown>)[segment]
  }, values)
}

export function formatConfigValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "—"
  }

  if (typeof value === "boolean") {
    return value ? "已启用" : "已关闭"
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatConfigValue).join("、") : "—"
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  return String(value)
}

export interface ParsedLogLine {
  id: string
  raw: string
  timestamp: Date | null
}

export interface LogBlock {
  id: string
  title: string
  timestamp: Date | null
  lines: ParsedLogLine[]
}

export interface LogSearchMatch {
  blockId: string
  lineId: string
}

const logTimePattern = /(?:^|\s)(\d{2}):(\d{2}):(\d{2})\.(\d{3})(?:\s|$)/u
const blockSeparatorPattern = /^[─━═—-]{3,}\s+(.+?)\s+[─━═—-]{3,}$/u
const angleBlockPattern = /^<{3}\s*(.+?)\s*>{3}$/u
const halfDayInMilliseconds = 12 * 60 * 60 * 1_000

interface LogLineWithParts extends ParsedLogLine {
  timeOfDay: number | null
}

/**
 * Converts AzurPilot's in-memory log tail into expandable task blocks.
 *
 * The current API exposes only time-of-day values. We anchor the newest timestamp to the
 * reference date and walk backwards, crossing to the previous day only at a midnight rollover.
 * This keeps the inference isolated so a future full timestamp from the API can replace it.
 */
export function parseLogBlocks(lines: string[], referenceDate = new Date()): LogBlock[] {
  const parsedLines = resolveLogTimestamps(lines, referenceDate)
  const blocks: LogBlock[] = []
  let title = "前序日志"
  let blockLines: ParsedLogLine[] = []

  function appendBlock() {
    if (blockLines.length === 0) {
      return
    }

    const firstLine = blockLines[0]
    const timestamp = firstLine?.timestamp ?? null
    blocks.push({
      id: `block-${hashString(`${title}:${timestamp?.getTime() ?? "unknown"}:${firstLine?.raw}`)}`,
      title,
      timestamp,
      lines: blockLines,
    })
    blockLines = []
  }

  for (const line of parsedLines) {
    const blockTitle = getBlockTitle(line.raw)
    if (blockTitle) {
      appendBlock()
      title = blockTitle
      continue
    }

    blockLines.push(line)
  }

  appendBlock()
  return blocks
}

export function findLogMatches(blocks: LogBlock[], search: string): LogSearchMatch[] {
  const keyword = normalizeLogSearch(search)
  if (!keyword) {
    return []
  }

  return blocks.flatMap((block) =>
    block.lines
      .filter((line) => normalizeLogSearch(line.raw).includes(keyword))
      .map((line) => ({ blockId: block.id, lineId: line.id })),
  )
}

export function normalizeLogSearch(value: string): string {
  return value.trim().toLocaleLowerCase("zh-CN")
}

/**
 * Gives the initial tail block its default expansion and preserves that choice when later blocks
 * arrive. New blocks open by default, but they never replace expansion choices already shown to
 * the user—including an older block the user explicitly collapsed.
 */
export function reconcileLogBlockExpansion(
  current: Record<string, boolean>,
  blockIds: readonly string[],
): Record<string, boolean> {
  if (blockIds.length === 0) {
    return current
  }

  const initializing = Object.keys(current).length === 0
  let next = current

  for (const [index, blockId] of blockIds.entries()) {
    if (Object.hasOwn(current, blockId)) {
      continue
    }

    if (next === current) {
      next = { ...current }
    }
    next[blockId] = initializing ? index === blockIds.length - 1 : true
  }

  return next
}

/**
 * Extends the in-page log history from a sliding backend tail without duplicating its overlap.
 * The backend currently returns at most 200 lines, so overlap detection is bounded by that small
 * window even when the browser session has accumulated many more lines.
 */
export function mergeLogTail(history: string[], incomingTail: string[]): string[] {
  if (incomingTail.length === 0) {
    return history
  }
  if (history.length === 0) {
    return incomingTail.slice()
  }

  const maximumOverlap = Math.min(history.length, incomingTail.length)
  for (let overlap = maximumOverlap; overlap > 0; overlap -= 1) {
    const historyStart = history.length - overlap
    let matches = true
    for (let index = 0; index < overlap; index += 1) {
      if (history[historyStart + index] !== incomingTail[index]) {
        matches = false
        break
      }
    }

    if (matches) {
      return overlap === incomingTail.length ? history : history.concat(incomingTail.slice(overlap))
    }
  }

  // A service restart or a polling gap longer than the tail window can remove all overlap. Keep
  // both sequences so the current browser session never discards information it already showed.
  return history.concat(incomingTail)
}

function resolveLogTimestamps(lines: string[], referenceDate: Date): LogLineWithParts[] {
  const occurrences = new Map<string, number>()
  const parsed = lines.map<LogLineWithParts>((raw) => {
    const time = parseTimeOfDay(raw)
    const occurrence = (occurrences.get(raw) ?? 0) + 1
    occurrences.set(raw, occurrence)
    return {
      // The tail window can shift while staying at 200 lines. Content + occurrence keeps IDs
      // stable across those refreshes, so the current search match does not jump unexpectedly.
      id: `line-${hashString(`${raw}:${occurrence}`)}`,
      raw,
      timestamp: null,
      timeOfDay: time,
    }
  })

  const day = new Date(referenceDate)
  day.setHours(0, 0, 0, 0)
  let laterTimeOfDay: number | null = null

  for (let index = parsed.length - 1; index >= 0; index -= 1) {
    const line = parsed[index]
    if (!line || line.timeOfDay === null) {
      continue
    }

    if (laterTimeOfDay !== null && line.timeOfDay - laterTimeOfDay > halfDayInMilliseconds) {
      day.setDate(day.getDate() - 1)
    }

    const timestamp = new Date(day)
    timestamp.setMilliseconds(line.timeOfDay)
    line.timestamp = timestamp
    laterTimeOfDay = line.timeOfDay
  }

  return parsed
}

function parseTimeOfDay(line: string): number | null {
  const match = logTimePattern.exec(line)
  if (!match) {
    return null
  }

  const [, hours = "0", minutes = "0", seconds = "0", milliseconds = "0"] = match
  return (
    Number(hours) * 60 * 60 * 1_000 +
    Number(minutes) * 60 * 1_000 +
    Number(seconds) * 1_000 +
    Number(milliseconds)
  )
}

function getBlockTitle(line: string): string | null {
  const value = line.trim()
  return (
    blockSeparatorPattern.exec(value)?.[1]?.trim() ??
    angleBlockPattern.exec(value)?.[1]?.trim() ??
    null
  )
}

function hashString(value: string): string {
  let hash = 2_166_136_261
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16_777_619)
  }
  return (hash >>> 0).toString(36)
}
