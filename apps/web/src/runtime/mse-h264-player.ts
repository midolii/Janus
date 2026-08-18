const MAX_QUEUE_ITEMS = 24
const MAX_QUEUE_BYTES = 12 * 1024 * 1024
const KEEP_BUFFER_SECONDS = 20

interface MediaSourceLike extends EventTarget {
  addSourceBuffer: (mime: string) => SourceBuffer
}

interface MediaSourceConstructorLike {
  new (): MediaSourceLike
  isTypeSupported: (mime: string) => boolean
}

interface MediaSourceEnvironment {
  ManagedMediaSource?: MediaSourceConstructorLike
  MediaSource?: MediaSourceConstructorLike
}

/** iPhone Safari exposes ManagedMediaSource where desktop browsers expose MediaSource. */
export function resolveMediaSourceConstructor(
  environment: MediaSourceEnvironment = globalThis as unknown as MediaSourceEnvironment,
) {
  return environment.ManagedMediaSource ?? environment.MediaSource
}

export class MseH264Player {
  readonly #video: HTMLVideoElement
  readonly #mediaSource: MediaSourceLike
  readonly #objectUrl: string
  readonly #onPlaying: () => void
  readonly #onFatalError: (error: Error) => void
  #sourceBuffer: SourceBuffer | null = null
  #queue: ArrayBuffer[] = []
  #queueBytes = 0
  #closed = false
  #failed = false
  #playing = false

  constructor(options: {
    video: HTMLVideoElement
    mime: string
    onPlaying: () => void
    onFatalError: (error: Error) => void
  }) {
    const MediaSourceConstructor = resolveMediaSourceConstructor()
    if (!MediaSourceConstructor?.isTypeSupported(options.mime)) {
      throw new Error(`当前浏览器不支持 ${options.mime}`)
    }

    this.#video = options.video
    // WebKit only enables ManagedMediaSource on iPhone when remote playback is disabled or an
    // alternate AirPlay URL is supplied. This WebSocket stream has no remotely playable URL.
    this.#video.disableRemotePlayback = true
    this.#onPlaying = options.onPlaying
    this.#onFatalError = options.onFatalError
    this.#mediaSource = new MediaSourceConstructor()
    this.#objectUrl = URL.createObjectURL(this.#mediaSource as unknown as MediaSource)
    this.#video.src = this.#objectUrl
    this.#video.muted = true
    this.#video.playsInline = true
    this.#video.addEventListener("playing", this.#handlePlaying)
    this.#video.addEventListener("canplay", this.#handlePlaying)
    this.#mediaSource.addEventListener("sourceopen", () => this.#open(options.mime), {
      once: true,
    })
  }

  push(buffer: ArrayBuffer) {
    if (this.#closed) {
      return
    }
    this.#queue.push(buffer)
    this.#queueBytes += buffer.byteLength
    if (this.#queue.length > MAX_QUEUE_ITEMS || this.#queueBytes > MAX_QUEUE_BYTES) {
      this.#fail(new Error("浏览器视频缓冲积压，正在重新连接"))
      return
    }
    this.#appendNext()
  }

  close() {
    if (this.#closed) {
      return
    }
    this.#closed = true
    this.#queue = []
    this.#queueBytes = 0
    this.#video.removeEventListener("playing", this.#handlePlaying)
    this.#video.removeEventListener("canplay", this.#handlePlaying)
    if (this.#sourceBuffer) {
      this.#sourceBuffer.removeEventListener("updateend", this.#handleUpdateEnd)
      try {
        if (this.#sourceBuffer.updating) {
          this.#sourceBuffer.abort()
        }
      } catch {
        // Safari 在 MediaSource 关闭后调用 abort 会抛出 InvalidStateError。
      }
    }
    try {
      this.#video.pause()
      this.#video.removeAttribute("src")
      this.#video.load()
    } catch {
      // 页面销毁过程中媒体元素可能已经不可用。
    }
    URL.revokeObjectURL(this.#objectUrl)
  }

  #open(mime: string) {
    if (this.#closed) {
      return
    }
    try {
      this.#sourceBuffer = this.#mediaSource.addSourceBuffer(mime)
      this.#sourceBuffer.mode = "segments"
      this.#sourceBuffer.addEventListener("updateend", this.#handleUpdateEnd)
      this.#appendNext()
      void this.#video.play().catch(() => undefined)
    } catch (error) {
      this.#fail(toError(error, "无法初始化浏览器视频缓冲"))
    }
  }

  #appendNext() {
    const sourceBuffer = this.#sourceBuffer
    if (!sourceBuffer || sourceBuffer.updating || this.#closed) {
      return
    }
    if (this.#trimBuffer(sourceBuffer)) {
      return
    }
    const buffer = this.#queue.shift()
    if (!buffer) {
      return
    }
    this.#queueBytes = Math.max(0, this.#queueBytes - buffer.byteLength)
    try {
      sourceBuffer.appendBuffer(buffer)
    } catch (error) {
      this.#fail(toError(error, "追加实时截图视频数据失败"))
    }
  }

  #trimBuffer(sourceBuffer: SourceBuffer) {
    if (sourceBuffer.buffered.length === 0 || !Number.isFinite(this.#video.currentTime)) {
      return false
    }
    const bufferStart = sourceBuffer.buffered.start(0)
    const bufferEnd = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1)
    if (bufferEnd - bufferStart <= KEEP_BUFFER_SECONDS * 2) {
      return false
    }
    const removeEnd = Math.max(bufferStart, bufferEnd - KEEP_BUFFER_SECONDS)
    try {
      if (this.#video.currentTime < removeEnd) {
        this.#video.currentTime = Math.max(removeEnd, bufferEnd - 0.5)
      }
      sourceBuffer.remove(bufferStart, removeEnd)
      return true
    } catch {
      return false
    }
  }

  #handleUpdateEnd = () => {
    this.#appendNext()
  }

  #handlePlaying = () => {
    if (!this.#playing) {
      this.#playing = true
      this.#onPlaying()
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
