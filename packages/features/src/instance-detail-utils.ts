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
  content: string
  raw: string
  timestamp: Date | null
  level: LogLevel | null
  dateText: string | null
  timeText: string | null
  message: string
  kind: "entry" | "substage"
}

export type LogLevel = "critical" | "debug" | "error" | "info" | "warning"

export interface LogBlock {
  id: string
  title: string
  timestamp: Date | null
  lines: ParsedLogLine[]
  hierarchyLevel: 1 | 2
}

export interface LogSourceLine {
  content: string
  timestampMs: number | null
}

export interface LogSection {
  id: string
  title: string
  timestamp: Date | null
  blocks: LogBlock[]
  explicit: boolean
}

export interface LogSearchMatch {
  blockId: string
  lineId: string
}

const logTimePattern = /(?:^|\s)(\d{2}):(\d{2}):(\d{2})\.(\d{3})(?:\s|$)/u
const blockSeparatorPattern = /^([─━═—-])\1{2,}\s+(.+?)\s+[─━═—-]{3,}$/u
const angleBlockPattern = /^<{3}\s*(.+?)\s*>{3}$/u
const outerSectionRulePattern = /^═{15,}$/u
const memoryLogPattern =
  /^\s*(DEBUG|INFO|WARN(?:ING)?|ERROR|CRITICAL)\s+(?:(\d{4}-\d{2}-\d{2})\s+)?(\d{2}:\d{2}:\d{2}\.\d{3})\s*[│|]\s?(.*)$/u
const fileLogPattern =
  /^\s*\d{4}-\d{2}-\d{2}\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s*\|\s*(DEBUG|INFO|WARN(?:ING)?|ERROR|CRITICAL)\s*\|\s?(.*)$/u
const ansiCsiPattern = new RegExp(`${String.fromCodePoint(27)}\\[[0-?]*[ -/]*[@-~]`, "gu")
const halfDayInMilliseconds = 12 * 60 * 60 * 1_000

interface LogLineWithParts extends ParsedLogLine {
  timeOfDay: number | null
}

/**
 * Converts AzurPilot's in-memory log tail into expandable task blocks.
 *
 * Structured API entries carry epoch milliseconds. Legacy line-only responses are anchored to
 * the reference date and walked backwards, crossing to the previous day at midnight rollover.
 */
export function parseLogBlocks(
  lines: readonly (LogSourceLine | string)[],
  referenceDate = new Date(),
): LogBlock[] {
  return parseLogSections(lines, referenceDate).flatMap((section) => section.blocks)
}

/**
 * Preserves AzurPilot's logger.hr hierarchy: level 0 is a three-line outer task banner, while
 * levels 1–2 become expandable blocks inside that task. Level 3 is a high-frequency substage
 * marker and stays inline so it cannot flood the interface with tiny one-line blocks.
 */
export function parseLogSections(
  lines: readonly (LogSourceLine | string)[],
  referenceDate = new Date(),
): LogSection[] {
  const parsedLines = resolveLogTimestamps(lines, referenceDate)
  const sections: LogSection[] = []
  const sectionOccurrences = new Map<string, number>()
  let sectionId = "section-preamble"
  let sectionTitle = "前序日志"
  let sectionExplicit = false
  let blocks: LogBlock[] = []
  let title = sectionTitle
  let hierarchyLevel: 1 | 2 = 1
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
      hierarchyLevel,
    })
    blockLines = []
  }

  function appendSection() {
    appendBlock()
    if (blocks.length === 0) {
      return
    }

    sections.push({
      id: sectionId,
      title: sectionTitle,
      timestamp: blocks[0]?.timestamp ?? null,
      blocks,
      explicit: sectionExplicit,
    })
    blocks = []
  }

  for (let index = 0; index < parsedLines.length; index += 1) {
    const line = parsedLines[index]
    if (!line) {
      continue
    }

    const outerTitle = getOuterSectionTitle(parsedLines, index)
    if (outerTitle) {
      appendSection()
      const occurrence = (sectionOccurrences.get(outerTitle) ?? 0) + 1
      sectionOccurrences.set(outerTitle, occurrence)
      sectionTitle = outerTitle
      sectionId = `section-${hashString(`${outerTitle}:${occurrence}`)}`
      sectionExplicit = true
      title = "阶段日志"
      hierarchyLevel = 1
      index += 2
      continue
    }

    const blockMarker = getBlockMarker(line)
    if (blockMarker) {
      appendBlock()
      title = blockMarker.title
      hierarchyLevel = blockMarker.hierarchyLevel
      continue
    }

    const substageTitle = getSubstageTitle(line)
    if (substageTitle) {
      blockLines.push({ ...line, kind: "substage", message: substageTitle })
      continue
    }

    blockLines.push(line)
  }

  appendSection()
  return sections
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

/** Structured equivalent of mergeLogTail. Timestamp participates in identity for repeated lines. */
export function mergeLogEntryTail(
  history: LogSourceLine[],
  incomingTail: LogSourceLine[],
): LogSourceLine[] {
  if (incomingTail.length === 0) {
    return history
  }
  if (history.length === 0) {
    return incomingTail.slice()
  }

  const isSame = (left: LogSourceLine, right: LogSourceLine) =>
    left.content === right.content && left.timestampMs === right.timestampMs
  const maximumOverlap = Math.min(history.length, incomingTail.length)
  for (let overlap = maximumOverlap; overlap > 0; overlap -= 1) {
    const historyStart = history.length - overlap
    let matches = true
    for (let index = 0; index < overlap; index += 1) {
      const historyLine = history[historyStart + index]
      const incomingLine = incomingTail[index]
      if (!historyLine || !incomingLine || !isSame(historyLine, incomingLine)) {
        matches = false
        break
      }
    }

    if (matches) {
      return overlap === incomingTail.length ? history : history.concat(incomingTail.slice(overlap))
    }
  }

  return history.concat(incomingTail)
}

function resolveLogTimestamps(
  lines: readonly (LogSourceLine | string)[],
  referenceDate: Date,
): LogLineWithParts[] {
  const occurrences = new Map<string, number>()
  const parsed = lines.map<LogLineWithParts>((source) => {
    const content = typeof source === "string" ? source : source.content
    const raw = stripAnsi(content)
    const timestampMs = typeof source === "string" ? null : source.timestampMs
    const time = parseTimeOfDay(raw)
    const identity = `${raw}:${timestampMs ?? "inferred"}`
    const occurrence = (occurrences.get(identity) ?? 0) + 1
    occurrences.set(identity, occurrence)
    return {
      // The tail window can shift while staying at 200 lines. Content + occurrence keeps IDs
      // stable across those refreshes, so the current search match does not jump unexpectedly.
      id: `line-${hashString(`${identity}:${occurrence}`)}`,
      content,
      raw,
      timestamp:
        timestampMs === null || !Number.isFinite(timestampMs) ? null : new Date(timestampMs),
      timeOfDay: time,
      kind: "entry",
      ...parseLogLine(raw),
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

    if (line.timestamp) {
      laterTimeOfDay = line.timeOfDay
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

function getOuterSectionTitle(lines: ParsedLogLine[], index: number): string | null {
  const opening = lines[index]?.raw.trim() ?? ""
  const title = lines[index + 1]?.raw.trim() ?? ""
  const closing = lines[index + 2]?.raw.trim() ?? ""

  if (
    !outerSectionRulePattern.test(opening) ||
    !outerSectionRulePattern.test(closing) ||
    !title ||
    title.length > 120 ||
    parseLogLine(title).level !== null
  ) {
    return null
  }

  return title
}

function getBlockMarker(line: ParsedLogLine): { title: string; hierarchyLevel: 1 | 2 } | null {
  const match = blockSeparatorPattern.exec(line.raw.trim())
  const title = match?.[2]?.trim()
  if (!match || !title) {
    return null
  }

  return { title, hierarchyLevel: match[1] === "═" ? 1 : 2 }
}

function getSubstageTitle(line: ParsedLogLine): string | null {
  return angleBlockPattern.exec(line.message.trim())?.[1]?.trim() ?? null
}

function parseLogLine(
  raw: string,
): Pick<ParsedLogLine, "dateText" | "level" | "message" | "timeText"> {
  const memoryMatch = memoryLogPattern.exec(raw)
  if (memoryMatch) {
    return {
      level: normalizeLogLevel(memoryMatch[1]),
      dateText: memoryMatch[2] ?? null,
      timeText: memoryMatch[3] ?? null,
      message: memoryMatch[4] ?? "",
    }
  }

  const fileMatch = fileLogPattern.exec(raw)
  if (fileMatch) {
    return {
      level: normalizeLogLevel(fileMatch[2]),
      dateText: raw.trim().slice(0, 10),
      timeText: fileMatch[1] ?? null,
      message: fileMatch[3] ?? "",
    }
  }

  return { level: null, dateText: null, timeText: null, message: raw }
}

function normalizeLogLevel(value?: string): LogLevel | null {
  switch (value?.toUpperCase()) {
    case "CRITICAL":
      return "critical"
    case "DEBUG":
      return "debug"
    case "ERROR":
      return "error"
    case "INFO":
      return "info"
    case "WARN":
    case "WARNING":
      return "warning"
    default:
      return null
  }
}

function hashString(value: string): string {
  let hash = 2_166_136_261
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16_777_619)
  }
  return (hash >>> 0).toString(36)
}

function stripAnsi(value: string): string {
  // Rich only emits CSI sequences for the REST ANSI mode. Keeping this local avoids coupling the
  // log parser to a renderer package while still making structural matching and search stable.
  return value.replace(ansiCsiPattern, "")
}
