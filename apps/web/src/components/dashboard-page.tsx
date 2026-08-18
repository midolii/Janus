import { Dashboard, type DashboardView } from "@janus/features/dashboard"
import { useNavigate, useRouter } from "@tanstack/react-router"

export interface DashboardPageProps {
  view: DashboardView
}

export function DashboardPage({ view }: DashboardPageProps) {
  const navigate = useNavigate()
  const router = useRouter()
  const { api, platform } = router.options.context

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

  return <Dashboard api={api} platform={platform} activeView={view} onNavigate={navigateTo} />
}
