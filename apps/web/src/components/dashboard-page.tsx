import { Dashboard, type DashboardView } from "@janus/features/dashboard"
import { isInstanceDetailTab } from "@janus/features/instance-detail-tabs"
import { useMatchRoute, useNavigate, useRouter } from "@tanstack/react-router"
import { useNavigationState } from "./navigation-state"

export function DashboardPage() {
  const matchRoute = useMatchRoute()
  const navigate = useNavigate()
  const router = useRouter()
  const { api, liveScreenshot, platform } = router.options.context
  const { expandedInstance, setExpandedInstance } = useNavigationState()
  // The dashboard shell stays mounted above leaf routes. Deriving the view from the committed
  // match keeps the URL authoritative while disclosure state remains purely presentational.
  const instanceRoute = matchRoute({
    to: "/instances/$instance/$tab",
    fuzzy: false,
  })
  const view: DashboardView =
    instanceRoute && isInstanceDetailTab(instanceRoute.tab)
      ? {
          kind: "instance",
          instance: instanceRoute.instance,
          tab: instanceRoute.tab,
        }
      : { kind: "dashboard" }

  function navigateTo(nextView: DashboardView) {
    if (nextView.kind === "dashboard") {
      void navigate({ to: "/" })
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
      onExpandedInstanceChange={setExpandedInstance}
      onNavigate={navigateTo}
    />
  )
}
