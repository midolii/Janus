import { describe, expect, it } from "vitest"
import { resolveMediaSourceConstructor } from "./mse-h264-player"

class TestMediaSource extends EventTarget {
  static isTypeSupported() {
    return true
  }

  addSourceBuffer(): SourceBuffer {
    throw new Error("not used by constructor resolution tests")
  }
}

class TestManagedMediaSource extends TestMediaSource {}

describe("resolveMediaSourceConstructor", () => {
  it("prefers ManagedMediaSource for iPhone Safari", () => {
    expect(
      resolveMediaSourceConstructor({
        ManagedMediaSource: TestManagedMediaSource,
        MediaSource: TestMediaSource,
      }),
    ).toBe(TestManagedMediaSource)
  })

  it("falls back to the standard MediaSource implementation", () => {
    expect(resolveMediaSourceConstructor({ MediaSource: TestMediaSource })).toBe(TestMediaSource)
  })

  it("reports no implementation when neither API exists", () => {
    expect(resolveMediaSourceConstructor({})).toBeUndefined()
  })
})
