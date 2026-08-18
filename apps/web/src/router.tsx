import { JanusApiClient } from "@janus/api-client/client"
import { FetchTransport } from "@janus/api-client/transport"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"

import { routeTree } from "./routeTree.gen"
import { BrowserLiveScreenshotRuntime } from "./runtime/browser-live-screenshot-runtime"

export interface RouterContext {
  api: JanusApiClient
  liveScreenshot: BrowserLiveScreenshotRuntime
  platform: "web"
  queryClient: QueryClient
}

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  })
  const api = new JanusApiClient(
    new FetchTransport({ baseUrl: import.meta.env.VITE_JANUS_API_BASE_URL }),
  )
  const liveScreenshot = new BrowserLiveScreenshotRuntime({
    baseUrl: import.meta.env.VITE_JANUS_STREAM_BASE_URL ?? import.meta.env.VITE_JANUS_API_BASE_URL,
  })

  const router = createTanStackRouter({
    routeTree,
    context: {
      api,
      liveScreenshot,
      platform: "web",
      queryClient,
    },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => <p>Not Found</p>,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
