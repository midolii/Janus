import { createFileRoute } from "@tanstack/react-router"

/** URL 只声明更新页状态；实际内容由根路由中的持久 Dashboard 外壳渲染。 */
export const Route = createFileRoute("/update")({ component: EmptyRoute })

function EmptyRoute() {
  return null
}
