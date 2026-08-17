# Janus Web

TanStack Start SPA 入口，只负责 Web 运行时组装、路由和页面。

```bash
pnpm --filter @janus/web dev
```

新增路由文件后，TanStack Router 会更新 `src/routeTree.gen.ts`。远程数据定义放在 `@janus/features`，REST 调用放在 `@janus/api-client`，可复用 UI 放在 `@janus/ui`。

本地开发保持浏览器请求同源 `/api/v1`，由 Vite 转发。复制 `.env.example` 为 `.env.local` 并设置 `JANUS_DEV_API_PROXY_TARGET`。如果上游受 Authelia 等 Guard 保护，可在本地文件中添加临时 `JANUS_DEV_API_PROXY_COOKIE` 或 `JANUS_DEV_API_PROXY_AUTHORIZATION`；这些变量没有 `VITE_` 前缀，不会进入浏览器 bundle。

Build the production app with:

```bash
pnpm --filter @janus/web build
```

开发环境会加载统一的 TanStack Devtools，并在一个工具栏内提供 Query、Router、Form 和 Table 面板；生产构建不会加载该组件。
