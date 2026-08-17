import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import type { RouterContext } from "../router"
import appCss from "../styles.css?url"

const DevelopmentTools = import.meta.env.DEV
  ? lazy(() => import("../components/devtools/development-tools"))
  : null

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Janus",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {DevelopmentTools ? (
          <Suspense fallback={null}>
            <DevelopmentTools />
          </Suspense>
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
