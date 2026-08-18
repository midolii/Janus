import { isInstanceDetailTab } from "@janus/features/instance-detail-tabs"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { DashboardPage } from "../../../components/dashboard-page"

export const Route = createFileRoute("/instances/$instance/$tab")({
  loader: ({ params }) => {
    if (!isInstanceDetailTab(params.tab)) {
      throw notFound()
    }

    return { tab: params.tab }
  },
  component: InstanceModule,
})

function InstanceModule() {
  const { instance } = Route.useParams()
  const { tab } = Route.useLoaderData()

  return <DashboardPage view={{ kind: "instance", instance, tab }} />
}
