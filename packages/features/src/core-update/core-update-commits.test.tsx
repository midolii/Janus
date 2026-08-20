import type { CoreCommitResponse } from "@janus/api-client/contracts"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CoreUpdateCommitHistory, CoreUpdateCommitSummary } from "./core-update-commits"

const commit: CoreCommitResponse = {
  sha1: "b6501df",
  author: "midolii",
  committedAt: "2026-08-20 10:30:00 +0800",
  message: "feat(api): 增加核心更新接口",
}

describe("core update commits", () => {
  it("keeps the summary separate from the history", () => {
    const markup = renderToStaticMarkup(
      <CoreUpdateCommitSummary localCommit={commit} upstreamCommit={commit} />,
    )

    expect(markup).toContain('aria-label="核心提交摘要"')
    expect(markup).toContain("当前核心")
    expect(markup).toContain("更新源最新提交")
  })

  it("fills the remaining height with a scrollbar-independent history", () => {
    const markup = renderToStaticMarkup(
      <CoreUpdateCommitHistory
        history={[commit]}
        sourceBranch="api-main"
        sourceRepository="midolii/AzurPilot"
      />,
    )

    expect(markup).toContain("flex min-h-0 flex-1 flex-col")
    expect(markup).toContain("sm:min-h-40")
    expect(markup).toContain("scrollbar-hidden")
    expect(markup).toContain("overflow-y-auto")
    expect(markup).toContain("midolii/AzurPilot · api-main")
  })
})
