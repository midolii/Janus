import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type ProxyOptions } from "vite"

const config = defineConfig(({ command, mode }) => {
  const proxyEnv = loadEnv(mode, process.cwd(), "JANUS_DEV_API_PROXY_")
  const proxyTarget = proxyEnv.JANUS_DEV_API_PROXY_TARGET
  const proxyHeaders = createProxyHeaders(proxyEnv)

  const proxyOptions: ProxyOptions | undefined = proxyTarget
    ? {
        target: proxyTarget,
        changeOrigin: true,
        headers: proxyHeaders,
      }
    : undefined

  return {
    publicDir: "../../packages/branding/web",
    resolve: { tsconfigPaths: true },
    plugins: [devtools(), tailwindcss(), tanstackStart({ spa: { enabled: true } }), viteReact()],
    server:
      command === "serve" && proxyOptions
        ? {
            proxy: {
              "/api": proxyOptions,
              "/ws": { ...proxyOptions, ws: true },
            },
          }
        : undefined,
  }
})

export default config

function createProxyHeaders(env: Record<string, string>) {
  const headers: Record<string, string> = {}

  if (env.JANUS_DEV_API_PROXY_COOKIE) {
    headers.Cookie = env.JANUS_DEV_API_PROXY_COOKIE
  }

  if (env.JANUS_DEV_API_PROXY_AUTHORIZATION) {
    headers.Authorization = env.JANUS_DEV_API_PROXY_AUTHORIZATION
  }

  return Object.keys(headers).length > 0 ? headers : undefined
}
