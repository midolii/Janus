# Janus Web

TanStack Start SPA 入口，只负责 Web 运行时组装、路由和页面。

```bash
pnpm --filter @janus/web dev
```

新增路由文件后，TanStack Router 会更新 `src/routeTree.gen.ts`。远程数据定义放在 `@janus/features`，REST 调用放在 `@janus/api-client`，可复用 UI 放在 `@janus/ui`。

Build the production app with:

```bash
pnpm --filter @janus/web build
```

开发环境会加载统一的 TanStack Devtools，并在一个工具栏内提供 Query、Router、Form 和 Table 面板；生产构建不会加载该组件。
