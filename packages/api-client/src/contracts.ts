export interface HealthResponse {
  status: "ok"
  apiVersion: string
}

export interface SystemResponse {
  apiVersion: string
  coreCommit: string
  pythonVersion: string
  platform: string
  capabilities: string[]
}

export interface InstanceResponse {
  name: string
  module: string
  running: boolean
  state: string
}

export interface InstanceListResponse {
  items: InstanceResponse[]
}

export interface LiveScreenshotStreamResponse {
  instance: string
  transport: "websocket"
  path: string
  codec: "h264"
  modes: Array<"auto" | "scrcpy" | "screenshot">
  defaultMode: "auto" | "scrcpy" | "screenshot"
  defaultFps: number
  defaultWidth: number
  defaultBitrateScale: number
}

export interface ConfigResponse {
  instance: string
  module: string
  revision: string
  values: Record<string, unknown>
  redactedPaths: string[]
}

export interface ConfigChangeRequest {
  path: string
  value: unknown
}

export interface ConfigPatchRequest {
  expectedRevision: string
  changes: ConfigChangeRequest[]
}

export interface ConfigOptionResponse {
  value: unknown
  label: string
}

export interface ConfigFieldResponse {
  key: string
  name: string
  displayName: string
  help: string
  widgetType: string
  default: unknown
  options: ConfigOptionResponse[]
  display: string | null
  readOnly: boolean
  sensitive: boolean
}

export interface ConfigGroupResponse {
  name: string
  displayName: string
  help: string
  fields: ConfigFieldResponse[]
}

export interface ConfigTaskResponse {
  name: string
  displayName: string
  help: string
  groups: ConfigGroupResponse[]
}

export interface ConfigMenuResponse {
  name: string
  displayName: string
  page: string | null
  menuType: string | null
  tasks: ConfigTaskResponse[]
}

export interface ConfigSchemaResponse {
  instance: string
  module: string
  language: string
  menus: ConfigMenuResponse[]
}

export interface TaskResponse {
  name: string
  displayName: string
  enabled: boolean
  state: string
  nextRun: string | null
}

export interface TaskListResponse {
  instance: string
  running: TaskResponse[]
  pending: TaskResponse[]
  waiting: TaskResponse[]
  disabled: TaskResponse[]
}

export interface InstanceActionResponse {
  action: "start" | "stop"
  changed: boolean
  instance: InstanceResponse
}

export interface TaskActionResponse {
  instance: string
  task: string
  action: "runNow"
  scheduledAt: string
  schedulerRunning: boolean
}

export interface LogTailResponse {
  instance: string
  source: string
  lines: string[]
  count: number
  truncated: boolean
  format?: "ansi" | "plain"
  entries?: LogLineResponse[]
}

export interface LogLineResponse {
  content: string
  timestampMs: number | null
}

export interface CoreCommitResponse {
  sha1: string
  author: string
  committedAt: string
  message: string
}

export type CoreUpdateStatus =
  | "upToDate"
  | "updateAvailable"
  | "checking"
  | "failed"
  | "starting"
  | "waitingForInstances"
  | "updating"
  | "restarting"
  | "finished"
  | "canceling"
  | "unknown"

export interface CoreUpdateResponse {
  status: CoreUpdateStatus
  available: boolean
  enabled: boolean
  sourceRepository: string
  sourceBranch: string
  localCommit: CoreCommitResponse | null
  upstreamCommit: CoreCommitResponse | null
  history: CoreCommitResponse[]
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}
