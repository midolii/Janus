import { describe, expect, it } from "vitest"
import { getH264NalType, H264AnnexBParser } from "./h264-annex-b"

describe("H264AnnexBParser", () => {
  it("restores NAL units split across websocket messages", () => {
    const parser = new H264AnnexBParser()
    const first = parser.push(Uint8Array.from([0, 0, 0, 1, 0x67, 1]).buffer)
    const second = parser.push(Uint8Array.from([2, 0, 0, 1, 0x68, 3, 0, 0, 0, 1, 0x65, 4]).buffer)

    expect(first).toEqual([])
    expect(second).toHaveLength(2)
    expect(getH264NalType(second[0] ?? new Uint8Array())).toBe(7)
    expect(getH264NalType(second[1] ?? new Uint8Array())).toBe(8)
  })

  it("normalizes a websocket message containing one raw NAL", () => {
    const parser = new H264AnnexBParser()
    const [nal] = parser.push(Uint8Array.from([0x65, 1, 2]).buffer)

    expect(Array.from(nal ?? [])).toEqual([0, 0, 0, 1, 0x65, 1, 2])
    expect(getH264NalType(nal ?? new Uint8Array())).toBe(5)
  })
})
