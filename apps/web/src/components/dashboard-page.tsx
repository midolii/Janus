import { Dashboard, type DashboardView } from "@janus/features/dashboard"
import { isInstanceDetailTab } from "@janus/features/instance-detail-tabs"
import { useMatchRoute, useNavigate, useRouter } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useNavigationState } from "./navigation-state"

const coreUpdatePollIntervalMs = parsePositiveInterval(
  import.meta.env.VITE_JANUS_CORE_UPDATE_POLL_INTERVAL_MS,
)

export function DashboardPage() {
  const matchRoute = useMatchRoute()
  const navigate = useNavigate()
  const router = useRouter()
  const { api, liveScreenshot, platform } = router.options.context
  const { expandedInstance, setExpandedInstance } = useNavigationState()
  const [routeHydrated, setRouteHydrated] = useState(false)
  useEffect(() => setRouteHydrated(true), [])
  // The dashboard shell stays mounted above leaf routes. Deriving the view from the committed
  // match keeps the URL authoritative while disclosure state remains purely presentational.
  // SPA shell hydration must retain the build-time dashboard view for the first browser render;
  // Start may hand off from shell mode before React hydrates a directly requested instance route.
  const instanceRoute = matchRoute({
    to: "/instances/$instance/$tab",
    fuzzy: false,
  })
  const updateRoute = matchRoute({ to: "/update", fuzzy: false })
  const view: DashboardView =
    routeHydrated && instanceRoute && isInstanceDetailTab(instanceRoute.tab)
      ? {
          kind: "instance",
          instance: instanceRoute.instance,
          tab: instanceRoute.tab,
        }
      : routeHydrated && updateRoute
        ? { kind: "update" }
        : { kind: "dashboard" }

  function navigateTo(nextView: DashboardView) {
    if (nextView.kind === "dashboard") {
      void navigate({ to: "/" })
      return
    }

    if (nextView.kind === "update") {
      void navigate({ to: "/update" })
      return
    }

    void navigate({
      to: "/instances/$instance/$tab",
      params: {
        instance: nextView.instance,
        tab: nextView.tab,
      },
    })
  }

  return (
    <Dashboard
      api={api}
      liveScreenshot={liveScreenshot}
      platform={platform}
      activeView={view}
      expandedInstance={expandedInstance}
      coreUpdatePollIntervalMs={coreUpdatePollIntervalMs}
      onExpandedInstanceChange={setExpandedInstance}
      onNavigate={navigateTo}
    />
  )
}

function parsePositiveInterval(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const interval = Number(value)
  return Number.isFinite(interval) && interval > 0 ? interval : undefined
}
