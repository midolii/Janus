import type { LiveScreenshotStreamResponse } from "@janus/api-client/contracts"
import type { LiveScreenshotRuntime, LiveScreenshotStatus } from "@janus/api-client/live-screenshot"
import { useEffect, useRef } from "react"

interface LiveScreenshotSurfaceProps {
  runtime: LiveScreenshotRuntime
  descriptor: LiveScreenshotStreamResponse
  instance: string
  onStatus: (status: LiveScreenshotStatus) => void
}

export function LiveScreenshotSurface({
  runtime,
  descriptor,
  instance,
  onStatus,
}: LiveScreenshotSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const statusHandlerRef = useRef(onStatus)
  statusHandlerRef.current = onStatus

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      return
    }

    const session = runtime.connect(
      { descriptor, instance },
      { video, canvas },
      { onStatus: (status) => statusHandlerRef.current(status) },
    )
    return () => session.close()
  }, [descriptor, instance, runtime])

  return (
    <div className="absolute inset-0 grid place-items-center bg-black">
      {/* 实时截图流始终静音且不包含音轨，因此无需字幕轨。 */}
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-contain"
        aria-label={`${instance} 实时截图`}
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full object-contain"
        aria-label={`${instance} 实时截图画布`}
        hidden
      />
    </div>
  )
}
