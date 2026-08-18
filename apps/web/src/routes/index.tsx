import { Dashboard } from "@janus/features/dashboard"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const { api, platform } = Route.useRouteContext()

  return <Dashboard api={api} platform={platform} />
}
