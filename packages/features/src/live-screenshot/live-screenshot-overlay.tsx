import type { JanusApiClient } from "@janus/api-client/client"
import type { InstanceResponse } from "@janus/api-client/contracts"
import type { LiveScreenshotRuntime, LiveScreenshotStatus } from "@janus/api-client/live-screenshot"
import {
  type LivePreviewMode,
  type LivePreviewStatusTone,
  LivePreviewWindow,
} from "@janus/ui/components/live-preview-window"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@janus/ui/components/select"
import { useQuery } from "@tanstack/react-query"
import { MonitorPlay } from "lucide-react"
import { useCallback, useState } from "react"
import { liveScreenshotQueryOptions } from "../api/queries"
import { LiveScreenshotSurface } from "./live-screenshot-surface"

interface LiveScreenshotOverlayProps {
  api: JanusApiClient
  runtime: LiveScreenshotRuntime
  instances: readonly InstanceResponse[]
  preferredInstance?: string
}

const idleStatus: LiveScreenshotStatus = {
  state: "connecting",
  message: "等待打开",
}

export function LiveScreenshotOverlay({
  api,
  runtime,
  instances,
  preferredInstance,
}: LiveScreenshotOverlayProps) {
  const [mode, setMode] = useState<LivePreviewMode>("closed")
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<LiveScreenshotStatus>(idleStatus)
  const instanceNames = instances.map((instance) => instance.name)
  const fallbackInstance =
    (preferredInstance && instanceNames.includes(preferredInstance) ? preferredInstance : null) ??
    instanceNames[0] ??
    ""
  const activeInstance =
    (selectedInstance && instanceNames.includes(selectedInstance) ? selectedInstance : null) ??
    fallbackInstance
  const descriptor = useQuery({
    ...liveScreenshotQueryOptions(api, activeInstance),
    enabled: mode !== "closed" && Boolean(activeInstance),
  })
  const displayedStatus: LiveScreenshotStatus = descriptor.isError
    ? {
        state: "error",
        message: descriptor.error instanceof Error ? descriptor.error.message : "实时截图不可用",
      }
    : streamStatus

  const changeMode = useCallback(
    (nextMode: LivePreviewMode) => {
      if (mode === "closed" && nextMode === "windowed") {
        setSelectedInstance(fallbackInstance)
        setStreamStatus({ state: "connecting", message: "正在读取媒体连接" })
      } else if (nextMode === "closed") {
        setStreamStatus(idleStatus)
      }
      setMode(nextMode)
    },
    [fallbackInstance, mode],
  )

  return (
    <LivePreviewWindow
      mode={mode}
      title={activeInstance ? `实时截图 · ${activeInstance}` : "实时截图"}
      statusLabel={displayedStatus.message}
      statusTone={getStatusTone(displayedStatus)}
      launcherDisabled={!activeInstance}
      headerControls={
        instanceNames.length > 1 ? (
          <Select
            value={activeInstance || null}
            onValueChange={(value) => {
              if (typeof value === "string") {
                setSelectedInstance(value)
                setStreamStatus({ state: "connecting", message: "正在切换实例" })
              }
            }}
          >
            <SelectTrigger
              className="h-8 max-w-30 border-white/12 bg-white/6 text-white text-xs hover:bg-white/10"
              size="sm"
              aria-label="切换实时截图实例"
            >
              <MonitorPlay className="size-3.5 text-white/55" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="border-white/10 bg-slate-900 text-white">
              {instanceNames.map((instance) => (
                <SelectItem key={instance} value={instance}>
                  {instance}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null
      }
      onModeChange={changeMode}
    >
      {descriptor.isPending ? (
        <PreviewMessage title="正在连接" detail="正在读取 AzurPilot 媒体能力…" />
      ) : null}
      {descriptor.isError ? (
        <PreviewMessage title="暂无画面" detail="连接信息显示在浮窗底部。" />
      ) : null}
      {descriptor.data ? (
        <LiveScreenshotSurface
          runtime={runtime}
          descriptor={descriptor.data}
          instance={activeInstance}
          onStatus={setStreamStatus}
        />
      ) : null}
    </LivePreviewWindow>
  )
}

function PreviewMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <MonitorPlay className="size-7 text-white/35" aria-hidden="true" />
      <p className="mt-3 font-medium text-sm text-white/82">{title}</p>
      <p className="mt-1 max-w-sm text-pretty text-white/45 text-xs leading-5">{detail}</p>
    </div>
  )
}

function getStatusTone(status: LiveScreenshotStatus): LivePreviewStatusTone {
  if (status.state === "playing") {
    return "success"
  }
  if (status.state === "reconnecting") {
    return "warning"
  }
  if (status.state === "error") {
    return "danger"
  }
  return "neutral"
}
