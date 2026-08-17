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

export interface ConfigResponse {
  instance: string
  module: string
  values: Record<string, unknown>
  redactedPaths: string[]
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

export interface LogTailResponse {
  instance: string
  source: string
  lines: string[]
  count: number
  truncated: boolean
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}
