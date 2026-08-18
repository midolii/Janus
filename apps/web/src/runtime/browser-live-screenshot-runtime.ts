import type {
  LiveScreenshotConnectionEvents,
  LiveScreenshotConnectionOptions,
  LiveScreenshotRuntime,
  LiveScreenshotSession,
  LiveScreenshotSurface,
} from "@janus/api-client/live-screenshot"
import { MseH264Player } from "./mse-h264-player"
import { hasWebCodecsH264Support, WebCodecsH264Player } from "./webcodecs-h264-player"

type StreamMode = "auto" | "scrcpy" | "screenshot"

interface ReadyMessage {
  type: "ready"
  mode?: string
  format?: "raw_h264"
  codec_string?: string
  mime?: string
  width?: number
  height?: number
  fps?: number
}

interface ResizeMessage {
  type: "resize"
  width?: number
  height?: number
}

interface ErrorMessage {
  type: "error"
  message?: string
}

type StreamMessage = ReadyMessage | ResizeMessage | ErrorMessage

interface StreamPlayer {
  push: (buffer: ArrayBuffer) => void
  close: () => void
  resize?: (width: number, height: number) => void
}

export interface BrowserLiveScreenshotRuntimeOptions {
  baseUrl?: string
  locationHref?: string
}

export class BrowserLiveScreenshotRuntime implements LiveScreenshotRuntime {
  readonly #baseUrl?: string
  readonly #locationHref?: string

  constructor(options: BrowserLiveScreenshotRuntimeOptions = {}) {
    this.#baseUrl = options.baseUrl
    this.#locationHref = options.locationHref
  }

  connect(
    options: LiveScreenshotConnectionOptions,
    surface: LiveScreenshotSurface,
    events: LiveScreenshotConnectionEvents,
  ): LiveScreenshotSession {
    let closed = false
    let generation = 0
    let mode: StreamMode = options.descriptor.defaultMode
    let player: StreamPlayer | null = null
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const cleanupConnection = () => {
      generation += 1
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      preserveLastVideoFrame(surface)
      player?.close()
      player = null
      if (socket) {
        socket.onopen = null
        socket.onmessage = null
        socket.onerror = null
        socket.onclose = null
        try {
          socket.close()
        } catch {
          // WebSocket 可能已经由服务端关闭。
        }
        socket = null
      }
    }

    const reconnect = (message: string, nextMode = mode, delay = 1_200) => {
      if (closed) {
        return
      }
      cleanupConnection()
      mode = nextMode
      events.onStatus({ state: "reconnecting", message })
      const currentGeneration = generation
      reconnectTimer = setTimeout(() => {
        if (!closed && currentGeneration === generation) {
          openSocket()
        }
      }, delay)
    }

    const startPlayer = (message: ReadyMessage, currentGeneration: number) => {
      const width = Math.max(1, message.width ?? options.descriptor.defaultWidth)
      const height = Math.max(1, message.height ?? Math.round((width * 9) / 16))
      const fps = Math.max(1, message.fps ?? options.descriptor.defaultFps)
      const markPlaying = () => {
        if (!closed && currentGeneration === generation) {
          events.onStatus({
            state: "playing",
            message: `${message.mode ?? mode} · ${fps} FPS`,
          })
        }
      }
      const failPlayer = (error: Error) => {
        if (currentGeneration !== generation) {
          return
        }
        if (message.format === "raw_h264" && mode !== "screenshot") {
          reconnect("当前浏览器改用 Safari 兼容流", "screenshot", 80)
          return
        }
        reconnect(error.message)
      }

      if (message.format === "raw_h264") {
        if (!hasWebCodecsH264Support()) {
          reconnect("当前浏览器改用 Safari 兼容流", "screenshot", 80)
          return
        }
        surface.video.hidden = true
        surface.canvas.hidden = false
        try {
          player = new WebCodecsH264Player({
            canvas: surface.canvas,
            codec: message.codec_string ?? "avc1.42E01E",
            width,
            height,
            fps,
            onPlaying: markPlaying,
            onFatalError: failPlayer,
          })
        } catch (error) {
          failPlayer(toError(error, "无法初始化 H.264 实时截图播放器"))
        }
        return
      }

      // Keep the previous decoded frame visible until the replacement MSE stream can play.
      surface.video.hidden = false
      try {
        player = new MseH264Player({
          video: surface.video,
          mime: message.mime ?? 'video/mp4; codecs="avc1.42E01E"',
          onPlaying: () => {
            surface.canvas.hidden = true
            surface.video.hidden = false
            markPlaying()
          },
          onFatalError: failPlayer,
        })
      } catch (error) {
        failPlayer(toError(error, "无法初始化实时截图播放器"))
      }
    }

    const handleTextMessage = (raw: string, currentGeneration: number) => {
      let message: StreamMessage
      try {
        message = JSON.parse(raw) as StreamMessage
      } catch {
        return
      }
      if (message.type === "ready") {
        startPlayer(message, currentGeneration)
      } else if (message.type === "resize") {
        player?.resize?.(Math.max(1, message.width ?? 1), Math.max(1, message.height ?? 1))
      } else if (message.type === "error") {
        reconnect(message.message || "实时截图服务返回错误")
      }
    }

    const openSocket = () => {
      if (closed) {
        return
      }
      cleanupConnection()
      const currentGeneration = generation
      events.onStatus({ state: "connecting", message: "正在连接实时截图" })
      const url = createLiveScreenshotUrl(
        {
          endpointPath: options.descriptor.path,
          instance: options.instance,
          codec: options.descriptor.codec,
          mode,
          fps: options.descriptor.defaultFps,
          width: options.descriptor.defaultWidth,
          bitrateScale: options.descriptor.defaultBitrateScale,
          baseUrl: this.#baseUrl,
        },
        this.#locationHref,
      )
      try {
        socket = new WebSocket(url)
      } catch (error) {
        reconnect(toError(error, "无法创建实时截图连接").message)
        return
      }
      socket.binaryType = "arraybuffer"
      socket.onmessage = (event) => {
        if (closed || currentGeneration !== generation) {
          return
        }
        if (typeof event.data === "string") {
          handleTextMessage(event.data, currentGeneration)
          return
        }
        void toArrayBuffer(event.data)
          .then((buffer) => {
            if (!closed && currentGeneration === generation) {
              player?.push(buffer)
            }
          })
          .catch((error) => reconnect(toError(error, "无法读取实时截图数据").message))
      }
      socket.onerror = () => {
        if (!closed && currentGeneration === generation) {
          events.onStatus({ state: "reconnecting", message: "实时截图连接异常" })
        }
      }
      socket.onclose = () => {
        if (!closed && currentGeneration === generation) {
          reconnect("实时截图已断开，正在重连")
        }
      }
    }

    openSocket()
    return {
      close: () => {
        closed = true
        cleanupConnection()
        surface.video.hidden = false
        surface.canvas.hidden = true
      },
    }
  }
}

/** Preserve the last decoded MSE frame while a failed stream reconnects instead of flashing black. */
function preserveLastVideoFrame(surface: LiveScreenshotSurface) {
  const { video, canvas } = surface
  if (video.hidden || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return
  }
  const width = video.videoWidth
  const height = video.videoHeight
  if (width < 1 || height < 1) {
    return
  }
  const context = canvas.getContext("2d")
  if (!context) {
    return
  }
  try {
    canvas.width = width
    canvas.height = height
    context.drawImage(video, 0, 0, width, height)
    canvas.hidden = false
    video.hidden = true
  } catch {
    // Safari may reject frame capture while the media pipeline is already being torn down.
  }
}

export function createLiveScreenshotUrl(
  options: {
    endpointPath: string
    instance: string
    codec: string
    mode: StreamMode
    fps: number
    width: number
    bitrateScale: number
    baseUrl?: string
  },
  locationHref = globalThis.location.href,
) {
  const base = new URL(options.baseUrl || locationHref, locationHref)
  const url = new URL(options.endpointPath, base)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  url.searchParams.set("instance", options.instance)
  url.searchParams.set("codec", options.codec)
  url.searchParams.set("mode", options.mode)
  url.searchParams.set("fps", String(options.fps))
  url.searchParams.set("width", String(options.width))
  url.searchParams.set("bitrate_scale", options.bitrateScale.toFixed(2))
  return url.toString()
}

async function toArrayBuffer(data: unknown) {
  if (data instanceof ArrayBuffer) {
    return data
  }
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  }
  if (data instanceof Blob) {
    return data.arrayBuffer()
  }
  throw new TypeError("未知的实时截图数据类型")
}

function toError(error: unknown, fallback: string) {
  return error instanceof Error ? error : new Error(fallback)
}
