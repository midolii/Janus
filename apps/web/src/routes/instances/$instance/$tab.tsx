import { isInstanceDetailTab } from "@janus/features/instance-detail-tabs"
import { createFileRoute, notFound } from "@tanstack/react-router"

/**
 * 声明 `/instances/:instance/:tab` 的动态路由结构，并在进入路由前校验详情 Tab。
 *
 * Dashboard 由根路由中的持久外壳统一渲染，避免切换 Tab 时卸载整个应用区域；
 * 因此该叶子路由只承担 URL 类型、参数匹配与校验职责，渲染组件有意保持为空。
 */
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
