import { isInstanceDetailTab } from "@janus/features/instance-detail-tabs"
import { createFileRoute, notFound } from "@tanstack/react-router"

export const Route = createFileRoute("/instances/$instance/$tab")({
  beforeLoad: ({ params }) => {
    if (!isInstanceDetailTab(params.tab)) {
      throw notFound()
    }
  },
  component: EmptyRoute,
})

function EmptyRoute() {
  return null
}
