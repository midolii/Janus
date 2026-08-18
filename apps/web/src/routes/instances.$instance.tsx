import { InstanceDetail } from "@janus/features/instance-detail"
import { type InstanceDetailTab, instanceDetailTabs } from "@janus/features/instance-detail-tabs"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/instances/$instance")({
  validateSearch: (search): { tab?: InstanceDetailTab } => ({
    tab:
      typeof search.tab === "string" && instanceDetailTabs.includes(search.tab as InstanceDetailTab)
        ? (search.tab as InstanceDetailTab)
        : undefined,
  }),
  component: InstanceRoute,
})

function InstanceRoute() {
  const { instance } = Route.useParams()
  const { tab = "overview" } = Route.useSearch()
  const { api, platform } = Route.useRouteContext()
  const navigate = Route.useNavigate()

  return (
    <InstanceDetail
      api={api}
      instance={instance}
      platform={platform}
      activeTab={tab}
      onBack={() => void navigate({ to: "/" })}
      onTabChange={(nextTab) =>
        void navigate({
          search: { tab: nextTab === "overview" ? undefined : nextTab },
          replace: true,
        })
      }
    />
  )
}
