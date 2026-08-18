import type {
  ConfigResponse,
  ConfigSchemaResponse,
  HealthResponse,
  InstanceListResponse,
  InstanceResponse,
  LiveScreenshotStreamResponse,
  LogTailResponse,
  SystemResponse,
  TaskListResponse,
} from "./contracts"
import type { ApiTransport } from "./transport"

export class JanusApiClient {
  constructor(readonly transport: ApiTransport) {}

  health(signal?: AbortSignal) {
    return this.transport.request<HealthResponse>({ path: "health", signal })
  }

  system(signal?: AbortSignal) {
    return this.transport.request<SystemResponse>({ path: "system", signal })
  }

  instances(signal?: AbortSignal) {
    return this.transport.request<InstanceListResponse>({ path: "instances", signal })
  }

  instance(instance: string, signal?: AbortSignal) {
    return this.transport.request<InstanceResponse>({
      path: `instances/${encodeURIComponent(instance)}`,
      signal,
    })
  }

  liveScreenshot(instance: string, signal?: AbortSignal) {
    return this.transport.request<LiveScreenshotStreamResponse>({
      path: `instances/${encodeURIComponent(instance)}/live-screenshot`,
      signal,
    })
  }

  config(instance: string, signal?: AbortSignal) {
    return this.transport.request<ConfigResponse>({
      path: `instances/${encodeURIComponent(instance)}/config`,
      signal,
    })
  }

  configSchema(instance: string, language = "zh-CN", signal?: AbortSignal) {
    return this.transport.request<ConfigSchemaResponse>({
      path: `instances/${encodeURIComponent(instance)}/config/schema`,
      query: { lang: language },
      signal,
    })
  }

  tasks(instance: string, signal?: AbortSignal) {
    return this.transport.request<TaskListResponse>({
      path: `instances/${encodeURIComponent(instance)}/tasks`,
      signal,
    })
  }

  logs(instance: string, limit = 200, signal?: AbortSignal, format: "ansi" | "plain" = "ansi") {
    return this.transport.request<LogTailResponse>({
      path: `instances/${encodeURIComponent(instance)}/logs`,
      query: { format, limit },
      signal,
    })
  }
}
