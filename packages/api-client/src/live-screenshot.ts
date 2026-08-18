import type { LiveScreenshotStreamResponse } from "./contracts"

export type LiveScreenshotStatus =
  | { state: "connecting"; message: string }
  | { state: "playing"; message: string }
  | { state: "reconnecting"; message: string }
  | { state: "error"; message: string }

export interface LiveScreenshotSurface {
  video: HTMLVideoElement
  canvas: HTMLCanvasElement
}

export interface LiveScreenshotConnectionOptions {
  descriptor: LiveScreenshotStreamResponse
  instance: string
}

export interface LiveScreenshotConnectionEvents {
  onStatus: (status: LiveScreenshotStatus) => void
}

export interface LiveScreenshotSession {
  close: () => void
}

/** 平台运行时负责媒体连接与逐帧渲染，业务组件只接收低频连接状态。 */
export interface LiveScreenshotRuntime {
  connect: (
    options: LiveScreenshotConnectionOptions,
    surface: LiveScreenshotSurface,
    events: LiveScreenshotConnectionEvents,
  ) => LiveScreenshotSession
}
