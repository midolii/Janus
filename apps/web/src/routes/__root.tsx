import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import type { RouterContext } from "../router"
import appCss from "../styles.css?url"

const DevelopmentTools = import.meta.env.DEV
  ? lazy(() => import("../components/devtools/development-tools"))
  : null

const designContract =
  "THESIS: Janus is an iPadOS-like remote operations console, not a generic metric-card dashboard. OWN-WORLD: Cool daylight, deep harbor blue, frosted white material, large continuous radii, hairline separators, and one blue interactive tint. STORY: The owner confirms API health, chooses an AzurPilot instance, reads live task state, and verifies the core environment without leaving the first screen. FIRST VIEWPORT: A frosted split-view shell frames navigation, one blue service overview, a live task queue, and compact environment facts; refresh stays at the upper right. FORM: iPadOS remote console, user-pinned direction; seed 0d11474a. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance."

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
      {
        name: "theme-color",
        content: "#dce9ef",
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
        {import.meta.env.DEV ? <template data-janus-design-contract={designContract} /> : null}
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
