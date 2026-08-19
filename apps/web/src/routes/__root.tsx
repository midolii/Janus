import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
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
      {
        rel: "icon",
        href: "/icons/favicon.ico",
        sizes: "32x32",
      },
      {
        rel: "icon",
        href: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "apple-touch-icon",
        href: "/icons/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/icons/site.webmanifest",
      },
    ],
  }),
  component: ApplicationShell,
  shellComponent: RootDocument,
})

function ApplicationShell() {
  // Leaf routes only validate and expose URL state. DashboardPage owns the persistent UI, so an
  // empty Outlet would add a route Suspense boundary that differs between the SPA shell build and
  // the browser's first matched route, causing hydration to discard the document.
  return <DashboardPage />
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
