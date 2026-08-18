import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import { DevelopmentSupport } from "../components/development-support"
import type { RouterContext } from "../router"
import appCss from "../styles.css?url"

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
        <DevelopmentSupport />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
