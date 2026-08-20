import { DateDisplay } from "@janus/ui/components/date-display"
import { cn } from "@janus/ui/lib/utils"
import AnsiImport from "ansi-to-react"
import { ChevronRight, Layers3 } from "lucide-react"
import type { ComponentType } from "react"
import type { LogBlock, LogLevel, LogSection, ParsedLogLine } from "../instance-detail-utils"
import { normalizeLogSearch } from "../instance-detail-utils"

const levelLabels: Record<LogLevel, string> = {
  critical: "CRITICAL",
  debug: "DEBUG",
  error: "ERROR",
  info: "INFO",
  warning: "WARNING",
}

const levelTextClasses: Record<LogLevel, string> = {
  critical: "font-semibold text-red-300",
  debug: "text-violet-300",
  error: "font-medium text-rose-300",
  info: "text-sky-300/90",
  warning: "font-medium text-amber-300",
}

const levelRowClasses: Record<LogLevel, string> = {
  critical: "bg-red-400/10 hover:bg-red-400/13",
  debug: "hover:bg-violet-300/5",
  error: "bg-rose-400/7 hover:bg-rose-400/10",
  info: "hover:bg-white/[0.035]",
  warning: "bg-amber-300/5 hover:bg-amber-300/8",
}

interface AnsiProps {
  children?: string
}

// ansi-to-react publishes CommonJS. Vite's client optimizer exposes the function directly, while
// TanStack Start SSR can expose one or two nested `default` wrappers. Normalize the boundary once
// instead of branching during render, keeping the server and client trees identical.
const Ansi = resolveDefaultComponent<AnsiProps>(AnsiImport)

interface LogSectionHeaderProps {
  section: LogSection
  expanded: boolean
  onToggle: () => void
}

/** Renders a logger.hr level 0 banner as a collapsible outer section row. */
export function LogSectionHeader({ section, expanded, onToggle }: LogSectionHeaderProps) {
  const lineCount = section.blocks.reduce((total, block) => total + block.lines.length, 0)
  return (
    <button
      className="flex min-h-11 w-full items-center gap-2.5 border-blue-300/10 border-y bg-slate-900/97 px-4 text-left shadow-[0_10px_24px_-22px_rgba(56,189,248,0.8)] backdrop-blur-xl transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:-outline-offset-2"
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <ChevronRight
        className={cn(
          "size-4 shrink-0 text-sky-300/65 transition-transform",
          expanded && "rotate-90",
        )}
        aria-hidden="true"
      />
      <Layers3 className="size-3.5 shrink-0 text-sky-300/80" aria-hidden="true" />
      <DateDisplay
        className="shrink-0 font-mono text-[0.66rem] text-slate-500 tabular-nums"
        value={section.timestamp}
        options={{ day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" }}
      />
      <span
        className="min-w-0 flex-1 truncate font-semibold text-[0.7rem] text-sky-100 tracking-[0.08em]"
        title={section.title}
      >
        {section.title}
      </span>
      <span className="shrink-0 text-[0.62rem] text-slate-500 tabular-nums">
        {section.blocks.length} 块 · {lineCount} 行
      </span>
    </button>
  )
}

interface LogBlockHeaderProps {
  block: LogBlock
  expanded: boolean
  nested: boolean
  onToggle: () => void
}

/** Renders logger.hr levels 1–2; the virtual viewport owns sticky positioning. */
export function LogBlockHeader({ block, expanded, nested, onToggle }: LogBlockHeaderProps) {
  return (
    <div
      className={cn(
        "relative",
        nested && "before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-sky-300/12",
        block.hierarchyLevel === 2 && "ml-3 border-slate-700/35 border-l",
      )}
    >
      <button
        className={cn(
          "flex min-h-12 w-full items-center gap-3 bg-slate-950/97 px-4 text-left backdrop-blur-xl transition-colors hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:-outline-offset-2",
          nested && "pl-7",
          block.hierarchyLevel === 2 && "min-h-10 bg-slate-950/92 pl-10",
        )}
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-slate-500 transition-transform",
            expanded && "rotate-90",
          )}
          aria-hidden="true"
        />
        <DateDisplay
          className="shrink-0 font-mono text-[0.68rem] text-slate-400 tabular-nums"
          value={block.timestamp}
          options={{ day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" }}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-medium text-slate-200 text-xs",
            block.hierarchyLevel === 2 && "text-[0.7rem] text-slate-300",
          )}
          title={block.title}
        >
          {block.title}
        </span>
        <span className="shrink-0 text-[0.65rem] text-slate-400 tabular-nums">
          {block.lines.length} 行
        </span>
      </button>
    </div>
  )
}

export function LogLine({
  current,
  line,
  nested,
  search,
  searchActive,
}: {
  current: boolean
  line: ParsedLogLine
  nested: boolean
  search: string
  searchActive: boolean
}) {
  if (line.kind === "substage") {
    return (
      <div
        id={line.id}
        aria-hidden={searchActive && !current ? true : undefined}
        className={cn(
          "flex min-h-7 items-center gap-2 whitespace-pre border-violet-300/12 border-y bg-violet-300/6 pr-4 pl-11 text-violet-200/90 transition-[background-color,opacity] duration-200",
          nested && "pl-14",
          searchActive && !current && "opacity-25",
          current && "bg-blue-400/15 text-white opacity-100",
        )}
      >
        <span className="text-violet-400/65" aria-hidden="true">
          └─
        </span>
        <span className="font-medium tracking-[0.03em]">
          {current ? <HighlightedLogText text={line.message} search={search} /> : line.message}
        </span>
        <span className="ml-auto text-[0.62rem] text-slate-500">
          <LogTimestamp line={line} compact />
        </span>
      </div>
    )
  }

  return (
    <div
      id={line.id}
      aria-hidden={searchActive && !current ? true : undefined}
      className={cn(
        "whitespace-pre pr-4 pl-11 transition-[background-color,opacity] duration-200",
        nested && "pl-14",
        line.level ? levelRowClasses[line.level] : "hover:bg-white/[0.035]",
        searchActive && !current && "opacity-25",
        current && "bg-blue-400/12 text-white opacity-100",
      )}
    >
      {current ? (
        <HighlightedLogText text={line.raw} search={search} />
      ) : (
        <LogLineText line={line} />
      )}
    </div>
  )
}

function LogLineText({ line }: { line: ParsedLogLine }) {
  if (!line.level || !line.timeText) {
    return line.raw
  }

  return (
    <>
      <span className={cn("inline-block w-16", levelTextClasses[line.level])}>
        {levelLabels[line.level]}
      </span>
      <LogTimestamp line={line} />
      <span className="text-slate-600"> │ </span>
      <LogMessageText line={line} />
    </>
  )
}

function LogTimestamp({ compact = false, line }: { compact?: boolean; line: ParsedLogLine }) {
  if (!line.timestamp) {
    return (
      <>
        {!compact && line.dateText ? (
          <span className="text-slate-500">{line.dateText} </span>
        ) : null}
        {line.timeText ? <LogTimeText value={line.timeText} /> : null}
      </>
    )
  }

  const milliseconds = String(line.timestamp.getMilliseconds()).padStart(3, "0")
  return (
    <>
      {!compact ? (
        <DateDisplay
          className="text-slate-500"
          value={line.timestamp}
          options={{ day: "2-digit", month: "2-digit", year: "numeric" }}
        />
      ) : null}
      {!compact ? " " : null}
      <DateDisplay
        className="text-cyan-200/72"
        value={line.timestamp}
        options={{ hour: "2-digit", hour12: false, minute: "2-digit", second: "2-digit" }}
      />
      <span className="text-slate-500">.{milliseconds}</span>
    </>
  )
}

function LogTimeText({ value }: { value: string }) {
  const millisecondsStart = value.lastIndexOf(".")
  if (millisecondsStart < 0) {
    return <span className="text-cyan-200/72">{value}</span>
  }

  return (
    <>
      <span className="text-cyan-200/72">{value.slice(0, millisecondsStart)}</span>
      <span className="text-slate-500">{value.slice(millisecondsStart)}</span>
    </>
  )
}

function LogMessageText({ line }: { line: ParsedLogLine }) {
  const ansiMessage = getAnsiMessage(line.content)
  if (ansiMessage) {
    return <Ansi>{ansiMessage}</Ansi>
  }

  const { message } = line
  const scopeMatch = /^((?:\[[^\]]+\]\s*)+)(.*)$/u.exec(message)
  if (!scopeMatch) {
    return message
  }

  return (
    <>
      <span className="text-blue-300/90">{scopeMatch[1]}</span>
      {scopeMatch[2]}
    </>
  )
}

function getAnsiMessage(content: string): string | null {
  if (!content.includes("\u001B[")) {
    return null
  }

  const separatorIndex = content.indexOf("│")
  return separatorIndex >= 0 ? content.slice(separatorIndex + 1).trimStart() : content
}

function resolveDefaultComponent<Props>(moduleValue: unknown): ComponentType<Props> {
  let candidate = moduleValue
  for (let depth = 0; depth < 3 && typeof candidate === "object" && candidate; depth += 1) {
    candidate = (candidate as { default?: unknown }).default
  }

  if (typeof candidate !== "function") {
    throw new TypeError("ansi-to-react did not expose a React component")
  }
  return candidate as ComponentType<Props>
}

function HighlightedLogText({ text, search }: { text: string; search: string }) {
  const keyword = normalizeLogSearch(search)
  const start = text.toLocaleLowerCase("zh-CN").indexOf(keyword)
  if (!keyword || start < 0) {
    return text
  }

  const end = start + keyword.length
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-amber-300/90 px-0.5 text-slate-950">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  )
}
