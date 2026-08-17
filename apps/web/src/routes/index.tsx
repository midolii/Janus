import { healthQueryOptions } from "@janus/features/queries"
import { Button } from "@janus/ui/components/button"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const { api, platform } = Route.useRouteContext()
  const health = useQuery(healthQueryOptions(api))

  return (
    <main>
      <h1>Janus</h1>
      <p>TanStack Start SPA 基础已就绪。</p>
      <dl>
        <dt>运行端</dt>
        <dd>{platform}</dd>
        <dt>API 状态</dt>
        <dd>{health.data?.status ?? (health.isPending ? "检查中" : "不可用")}</dd>
        <dt>API 版本</dt>
        <dd>{health.data?.apiVersion ?? "-"}</dd>
      </dl>
      {health.isError ? (
        <p role="alert">{health.error instanceof Error ? health.error.message : "请求失败"}</p>
      ) : null}
      <Button type="button" variant="outline" onClick={() => health.refetch()}>
        重新检查
      </Button>
    </main>
  )
}
