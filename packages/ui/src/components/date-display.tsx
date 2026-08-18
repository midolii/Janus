import type { ComponentPropsWithoutRef } from "react"

type DateValue = Date | number | string | null | undefined

interface DateDisplayCommonProps
  extends Omit<ComponentPropsWithoutRef<"time">, "children" | "dateTime"> {
  fallback?: string
  locale?: Intl.LocalesArgument
  timeZone?: string
  value: DateValue
}

interface AbsoluteDateDisplayProps extends DateDisplayCommonProps {
  mode?: "absolute"
  options?: Intl.DateTimeFormatOptions
  referenceTime?: never
}

interface RelativeDateDisplayProps extends DateDisplayCommonProps {
  mode: "relative"
  options?: Intl.RelativeTimeFormatOptions
  /** Keep the clock explicit so server and client produce identical hydration output. */
  referenceTime: Date | number
}

export type DateDisplayProps = AbsoluteDateDisplayProps | RelativeDateDisplayProps

const defaultAbsoluteOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "numeric",
}

/**
 * The single date rendering boundary for Janus. Callers provide the semantic date while this
 * component owns locale formatting and the native machine-readable <time> value.
 */
export function DateDisplay({
  fallback,
  locale = "zh-CN",
  mode = "absolute",
  options,
  referenceTime,
  timeZone = "Asia/Shanghai",
  value,
  ...props
}: DateDisplayProps) {
  const date = toValidDate(value)
  if (!date) {
    return <span {...props}>{fallback ?? (typeof value === "string" ? value : "—")}</span>
  }

  const content =
    mode === "relative" && referenceTime !== undefined
      ? formatRelativeDate(date, referenceTime, locale, options)
      : new Intl.DateTimeFormat(locale, {
          ...(options ?? defaultAbsoluteOptions),
          timeZone,
        }).format(date)
  const title = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone,
    timeStyle: "medium",
  }).format(date)

  return (
    <time dateTime={date.toISOString()} title={title} {...props}>
      {content}
    </time>
  )
}

function toValidDate(value: DateValue): Date | null {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatRelativeDate(
  date: Date,
  referenceTime: Date | number,
  locale: Intl.LocalesArgument,
  options?: Intl.RelativeTimeFormatOptions,
) {
  const differenceInSeconds = (date.getTime() - new Date(referenceTime).getTime()) / 1_000
  const absoluteSeconds = Math.abs(differenceInSeconds)
  let divisor = 1
  let unit: Intl.RelativeTimeFormatUnit = "second"

  if (absoluteSeconds >= 86_400) {
    divisor = 86_400
    unit = "day"
  } else if (absoluteSeconds >= 3_600) {
    divisor = 3_600
    unit = "hour"
  } else if (absoluteSeconds >= 60) {
    divisor = 60
    unit = "minute"
  }

  return new Intl.RelativeTimeFormat(locale, options ?? { numeric: "auto" }).format(
    Math.round(differenceInSeconds / divisor),
    unit,
  )
}
