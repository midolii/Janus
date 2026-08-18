import type { JanusApiClient } from "@janus/api-client/client"
import { ApiError } from "@janus/api-client/transport"
import { queryOptions } from "@tanstack/react-query"

export const queryKeys = {
  health: ["health"] as const,
  system: ["system"] as const,
  instances: ["instances"] as const,
  instance: (instance: string) => ["instances", instance] as const,
  liveScreenshot: (instance: string) => ["instances", instance, "live-screenshot"] as const,
  config: (instance: string) => ["instances", instance, "config"] as const,
  configSchema: (instance: string, language: string) =>
    ["instances", instance, "config-schema", language] as const,
  tasks: (instance: string) => ["instances", instance, "tasks"] as const,
  logs: (instance: string, limit: number, format: "ansi" | "plain") =>
    ["instances", instance, "logs", limit, format] as const,
}

export function healthQueryOptions(api: JanusApiClient) {
  return queryOptions({
    queryKey: queryKeys.health,
    queryFn: ({ signal }) => api.health(signal),
    staleTime: 60_000,
    retry: retryApiRequest,
  })
}

export function systemQueryOptions(api: JanusApiClient) {
  return queryOptions({
    queryKey: queryKeys.system,
    queryFn: ({ signal }) => api.system(signal),
    staleTime: 60_000,
    retry: retryApiRequest,
  })
}

export function instancesQueryOptions(api: JanusApiClient) {
  return queryOptions({
    queryKey: queryKeys.instances,
    queryFn: ({ signal }) => api.instances(signal),
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: retryApiRequest,
  })
}

export function instanceQueryOptions(api: JanusApiClient, instance: string) {
  return queryOptions({
    queryKey: queryKeys.instance(instance),
    queryFn: ({ signal }) => api.instance(instance, signal),
    staleTime: 5_000,
    retry: retryApiRequest,
  })
}

export function liveScreenshotQueryOptions(api: JanusApiClient, instance: string) {
  return queryOptions({
    queryKey: queryKeys.liveScreenshot(instance),
    queryFn: ({ signal }) => api.liveScreenshot(instance, signal),
    staleTime: Number.POSITIVE_INFINITY,
    retry: retryApiRequest,
  })
}

export function configQueryOptions(api: JanusApiClient, instance: string) {
  return queryOptions({
    queryKey: queryKeys.config(instance),
    queryFn: ({ signal }) => api.config(instance, signal),
    staleTime: 10_000,
    retry: retryApiRequest,
  })
}

export function configSchemaQueryOptions(
  api: JanusApiClient,
  instance: string,
  language = "zh-CN",
) {
  return queryOptions({
    queryKey: queryKeys.configSchema(instance, language),
    queryFn: ({ signal }) => api.configSchema(instance, language, signal),
    staleTime: Number.POSITIVE_INFINITY,
    retry: retryApiRequest,
  })
}

export function tasksQueryOptions(api: JanusApiClient, instance: string) {
  return queryOptions({
    queryKey: queryKeys.tasks(instance),
    queryFn: ({ signal }) => api.tasks(instance, signal),
    refetchInterval: 3_000,
    retry: retryApiRequest,
  })
}

export function logsQueryOptions(api: JanusApiClient, instance: string, limit = 200) {
  const format = "ansi" as const
  return queryOptions({
    queryKey: queryKeys.logs(instance, limit, format),
    queryFn: ({ signal }) => api.logs(instance, limit, signal, format),
    refetchInterval: 2_000,
    retry: retryApiRequest,
  })
}

function retryApiRequest(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status < 500) {
    return false
  }

  return failureCount < 2
}
