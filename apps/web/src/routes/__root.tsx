import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router"
import { DashboardPage } from "../components/dashboard-page"
import { DevelopmentSupport } from "../components/development-support"
import { NavigationStateProvider } from "../components/navigation-state"
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
  component: ApplicationShell,
  shellComponent: RootDocument,
})

function ApplicationShell() {
  return (
    <>
      <DashboardPage />
      <Outlet />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        <DevelopmentSupport />
        <NavigationStateProvider>{children}</NavigationStateProvider>
        <Scripts />
      </body>
    </html>
  )
}
