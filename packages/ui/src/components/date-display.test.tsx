import { DateDisplay } from "@janus/ui/components/date-display"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("DateDisplay", () => {
  it("renders a semantic absolute date", () => {
    const markup = renderToStaticMarkup(
      <DateDisplay
        value={new Date("2026-08-18T01:31:08.686Z")}
        locale="en-GB"
        options={{ day: "2-digit", month: "2-digit", year: "numeric" }}
      />,
    )

    expect(markup).toContain('dateTime="2026-08-18T01:31:08.686Z"')
    expect(markup).toContain("18/08/2026")
  })

  it("renders relative time against an explicit hydration-safe clock", () => {
    const markup = renderToStaticMarkup(
      <DateDisplay
        mode="relative"
        value={new Date("2026-08-18T02:00:00.000Z")}
        referenceTime={new Date("2026-08-18T01:00:00.000Z")}
        locale="zh-CN"
      />,
    )

    expect(markup).toContain("1小时后")
  })

  it("uses a fallback for a missing value", () => {
    expect(renderToStaticMarkup(<DateDisplay value={null} fallback="暂无" />)).toContain("暂无")
  })
})
