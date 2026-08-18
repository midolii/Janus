import { describe, expect, it } from "vitest"
import { createLiveScreenshotUrl } from "./browser-live-screenshot-runtime"

describe("createLiveScreenshotUrl", () => {
  it("uses the current origin behind a development proxy", () => {
    const url = createLiveScreenshotUrl(
      {
        endpointPath: "/ws/live_screenshot",
        instance: "alas",
        codec: "h264",
        mode: "auto",
        fps: 30,
        width: 640,
        bitrateScale: 0.7,
      },
      "http://localhost:3000/instances/alas/logs",
    )

    expect(url).toBe(
      "ws://localhost:3000/ws/live_screenshot?instance=alas&codec=h264&mode=auto&fps=30&width=640&bitrate_scale=0.70",
    )
  })

  it("derives the websocket origin from a cross-origin API base URL", () => {
    const url = createLiveScreenshotUrl(
      {
        endpointPath: "/ws/live_screenshot",
        instance: "港区 1",
        codec: "h264",
        mode: "screenshot",
        fps: 24,
        width: 960,
        bitrateScale: 1,
        baseUrl: "https://ap.midolii.com/api/v1",
      },
      "https://janus.midolii.com/",
    )

    expect(url).toBe(
      "wss://ap.midolii.com/ws/live_screenshot?instance=%E6%B8%AF%E5%8C%BA+1&codec=h264&mode=screenshot&fps=24&width=960&bitrate_scale=1.00",
    )
  })
})
