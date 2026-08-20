import { describe, expect, it } from "vitest"
import { getCoreUpdatePollInterval } from "./queries"

describe("core update polling", () => {
  it("uses the configured interval while the updater is idle", () => {
    expect(getCoreUpdatePollInterval("upToDate", 90_000)).toBe(90_000)
    expect(getCoreUpdatePollInterval("updateAvailable", 90_000)).toBe(90_000)
  })

  it("temporarily follows active update work more closely", () => {
    expect(getCoreUpdatePollInterval("checking", 90_000)).toBe(1_000)
    expect(getCoreUpdatePollInterval("updating", 90_000)).toBe(1_000)
  })

  it("can disable polling for a cache-only observer", () => {
    expect(getCoreUpdatePollInterval("checking", false)).toBe(false)
  })
})
