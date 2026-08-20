import type {
  ConfigPatchRequest,
  ConfigResponse,
  ConfigSchemaResponse,
  CoreUpdateResponse,
  HealthResponse,
  InstanceActionResponse,
  InstanceListResponse,
  InstanceResponse,
  LiveScreenshotStreamResponse,
  LogTailResponse,
  SystemResponse,
  TaskActionResponse,
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

  coreUpdate(signal?: AbortSignal) {
    return this.transport.request<CoreUpdateResponse>({ path: "updates/core", signal })
  }

  checkCoreUpdate(signal?: AbortSignal) {
    return this.transport.request<CoreUpdateResponse>({
      path: "updates/core/check",
      method: "POST",
      signal,
    })
  }

  applyCoreUpdate(signal?: AbortSignal) {
    return this.transport.request<CoreUpdateResponse>({
      path: "updates/core/apply",
      method: "POST",
      signal,
    })
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

  updateConfig(instance: string, request: ConfigPatchRequest, signal?: AbortSignal) {
    return this.transport.request<ConfigResponse>({
      path: `instances/${encodeURIComponent(instance)}/config`,
      method: "PATCH",
      body: request,
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

  runTaskNow(instance: string, task: string, signal?: AbortSignal) {
    return this.transport.request<TaskActionResponse>({
      path: `instances/${encodeURIComponent(instance)}/tasks/${encodeURIComponent(task)}/run-now`,
      method: "POST",
      signal,
    })
  }

  startInstance(instance: string, signal?: AbortSignal) {
    return this.instanceAction(instance, "start", signal)
  }

  stopInstance(instance: string, signal?: AbortSignal) {
    return this.instanceAction(instance, "stop", signal)
  }

  logs(instance: string, limit = 200, signal?: AbortSignal, format: "ansi" | "plain" = "ansi") {
    return this.transport.request<LogTailResponse>({
      path: `instances/${encodeURIComponent(instance)}/logs`,
      query: { format, limit },
      signal,
    })
  }

  private instanceAction(instance: string, action: "start" | "stop", signal?: AbortSignal) {
    return this.transport.request<InstanceActionResponse>({
      path: `instances/${encodeURIComponent(instance)}/${action}`,
      method: "POST",
      signal,
    })
  }
}
