import { concatH264Nals, getH264NalType, H264AnnexBParser } from "./h264-annex-b"

interface VideoFrameLike {
  close: () => void
}

interface VideoDecoderLike {
  decodeQueueSize: number
  configure: (config: { codec: string; optimizeForLatency: boolean }) => void
  decode: (chunk: unknown) => void
  close: () => void
}

interface WebCodecsConstructors {
  VideoDecoder: new (init: {
    output: (frame: VideoFrameLike) => void
    error: (error: Error) => void
  }) => VideoDecoderLike
  EncodedVideoChunk: new (init: {
    type: "key" | "delta"
    timestamp: number
    duration: number
    data: Uint8Array
  }) => unknown
}

export function hasWebCodecsH264Support() {
  const browser = globalThis as typeof globalThis & Partial<WebCodecsConstructors>
  return Boolean(browser.VideoDecoder && browser.EncodedVideoChunk)
}

export class WebCodecsH264Player {
  readonly #canvas: HTMLCanvasElement
  readonly #context: CanvasRenderingContext2D
  readonly #constructors: WebCodecsConstructors
  readonly #decoder: VideoDecoderLike
  readonly #parser = new H264AnnexBParser()
  readonly #frameDuration: number
  readonly #onPlaying: () => void
  readonly #onFatalError: (error: Error) => void
  #accessUnit: Uint8Array[] = []
  #configured = false
  #closed = false
  #failed = false
  #playing = false
  #timestamp = 0
  #waitingForKeyFrame = true

  constructor(options: {
    canvas: HTMLCanvasElement
    codec: string
    width: number
    height: number
    fps: number
    onPlaying: () => void
    onFatalError: (error: Error) => void
  }) {
    const browser = globalThis as typeof globalThis & Partial<WebCodecsConstructors>
    if (!browser.VideoDecoder || !browser.EncodedVideoChunk) {
      throw new Error("当前浏览器不支持 WebCodecs H.264 解码")
    }
    const context = options.canvas.getContext("2d")
    if (!context) {
      throw new Error("无法创建实时截图 Canvas")
    }

    this.#canvas = options.canvas
    this.#context = context
    this.#constructors = browser as typeof globalThis & WebCodecsConstructors
    this.#canvas.width = options.width
    this.#canvas.height = options.height
    this.#frameDuration = Math.max(1, Math.round(1_000_000 / Math.max(1, options.fps)))
    this.#onPlaying = options.onPlaying
    this.#onFatalError = options.onFatalError
    this.#decoder = new this.#constructors.VideoDecoder({
      output: (frame) => this.#drawFrame(frame),
      error: (error) => this.#fail(error),
    })

    try {
      this.#decoder.configure({ codec: options.codec, optimizeForLatency: true })
      this.#configured = true
    } catch (error) {
      this.#closed = true
      try {
        this.#decoder.close()
      } catch {
        // 初始化失败时解码器可能已经自行关闭。
      }
      throw toError(error, "WebCodecs H.264 初始化失败")
    }
  }

  push(buffer: ArrayBuffer) {
    if (this.#closed || !this.#configured) {
      return
    }
    for (const nal of this.#parser.push(buffer)) {
      const type = getH264NalType(nal)
      if (!type) {
        continue
      }
      if ((type === 1 || type === 5) && this.#accessUnit.length > 0) {
        this.#decodeAccessUnit()
      }
      this.#accessUnit.push(nal)
    }
    this.#decodeAccessUnit()
  }

  resize(width: number, height: number) {
    this.#canvas.width = Math.max(1, width)
    this.#canvas.height = Math.max(1, height)
  }

  close() {
    if (this.#closed) {
      return
    }
    this.#closed = true
    this.#parser.reset()
    this.#accessUnit = []
    try {
      this.#decoder.close()
    } catch {
      // 解码器可能已因浏览器错误自行关闭。
    }
  }

  #decodeAccessUnit() {
    if (this.#accessUnit.length === 0) {
      return
    }
    const types = this.#accessUnit.map(getH264NalType)
    const hasSlice = types.some((type) => type === 1 || type === 5)
    const hasKeyFrame = types.includes(5)
    if (!hasSlice) {
      return
    }
    if (this.#waitingForKeyFrame && !hasKeyFrame) {
      this.#accessUnit = []
      return
    }

    const chunk = new this.#constructors.EncodedVideoChunk({
      type: hasKeyFrame ? "key" : "delta",
      timestamp: this.#timestamp,
      duration: this.#frameDuration,
      data: concatH264Nals(this.#accessUnit),
    })
    this.#timestamp += this.#frameDuration
    this.#accessUnit = []
    this.#waitingForKeyFrame = false

    try {
      if (this.#decoder.decodeQueueSize <= 4) {
        this.#decoder.decode(chunk)
      }
    } catch (error) {
      this.#waitingForKeyFrame = true
      this.#fail(toError(error, "H.264 视频解码失败"))
    }
  }

  #drawFrame(frame: VideoFrameLike) {
    if (this.#closed) {
      frame.close()
      return
    }
    try {
      this.#context.drawImage(
        frame as unknown as CanvasImageSource,
        0,
        0,
        this.#canvas.width,
        this.#canvas.height,
      )
      if (!this.#playing) {
        this.#playing = true
        this.#onPlaying()
      }
    } finally {
      frame.close()
    }
  }

  #fail(error: Error) {
    if (!this.#closed && !this.#failed) {
      this.#failed = true
      this.#onFatalError(error)
    }
  }
}

function toError(error: unknown, fallback: string) {
  return error instanceof Error ? error : new Error(fallback)
}
