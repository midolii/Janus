# Janus

面向 AzurPilot REST API 的 Web 与 Electron 双端客户端 monorepo。

当前使用 TanStack Start 的 SPA 模式。保留 Start 是为了以后确有首屏、公开页面或服务端聚合需求时可以启用 SSR；现阶段所有 AzurPilot 数据均由浏览器直接请求 REST API。

## 目录

```text
apps/
  web/          TanStack Start SPA
  electron/     Electron 预留入口
packages/
  api-client/   REST 契约、客户端与可替换传输层
  features/     TanStack Query 等可复用业务定义
  ui/           Tailwind v4 + shadcn/ui + Storybook
```

项目处于基础设施阶段，暂不定义最终业务视觉样式。

## 开始开发

```bash
pnpm install
pnpm dev
```

常用入口：

- Web：`pnpm --filter @janus/web dev`
- Storybook：`pnpm storybook`
- 自动修复 Biome 与 Tailwind class 顺序：`pnpm check:write`
- 完整校验：`pnpm validate`

默认请求同源 `/api/v1`。如果 Web 与 AzurPilot 分别部署，复制 `apps/web/.env.example` 为 `apps/web/.env.local`，设置 `VITE_JANUS_API_BASE_URL`。跨域部署仍需服务端 Guard/Caddy 正确配置 CORS 与凭据 Cookie。

详细边界与 Electron 演进方式见 [架构说明](docs/architecture.md)。
