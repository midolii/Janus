import type { ErrorResponse } from "./contracts"

export interface TransportRequest {
  path: string
  method?: "GET" | "PATCH" | "POST"
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  signal?: AbortSignal
}

export interface ApiTransport {
  request<T>(request: TransportRequest): Promise<T>
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export interface FetchTransportOptions {
  baseUrl?: string
  credentials?: RequestCredentials
  fetcher?: typeof globalThis.fetch
}

export class FetchTransport implements ApiTransport {
  readonly #baseUrl: string
  readonly #credentials: RequestCredentials
  readonly #fetcher: typeof globalThis.fetch

  constructor(options: FetchTransportOptions = {}) {
    this.#baseUrl = (options.baseUrl ?? "/api/v1").replace(/\/$/, "")
    this.#credentials = options.credentials ?? "include"
    this.#fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
  }

  async request<T>({ path, method = "GET", query, body, signal }: TransportRequest): Promise<T> {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        search.set(key, String(value))
      }
    }

    const suffix = search.size > 0 ? `?${search.toString()}` : ""
    const response = await this.#fetcher(`${this.#baseUrl}/${path.replace(/^\//, "")}${suffix}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: this.#credentials,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      method,
      signal,
    })

    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      throw new ApiError("API returned a non-JSON response", response.status, "invalid_response")
    }

    const responseBody = (await response.json()) as T | ErrorResponse
    if (!response.ok) {
      const detail = isErrorResponse(responseBody)
        ? responseBody.error
        : { code: "request_failed", message: response.statusText }
      throw new ApiError(detail.message, response.status, detail.code)
    }

    return responseBody as T
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false
  }

  const error = value.error
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string" &&
      "message" in error &&
      typeof error.message === "string",
  )
}
