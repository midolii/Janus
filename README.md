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

## 部署 Web

服务器首次拉取包含部署脚本的版本后，在仓库根目录执行：

```bash
pnpm deploy:web
```

该命令默认在 `main` 分支上快进同步 `origin/main`，安装锁定依赖，依次运行 Biome、类型检查、测试和 Web 生产构建，将 TanStack Start SPA 的 `_shell.html` 转换为 Caddy 使用的 `index.html`，然后把静态文件发布到 `/var/www/janus/releases/<git-sha>`，最后原子切换 `/var/www/janus/current`。Caddy 直接读取 `current` 时无需重启。

部署要求工作区干净，并且服务器分支不能包含尚未推送的提交。必要时可通过 `JANUS_DEPLOY_ROOT`、`JANUS_DEPLOY_BRANCH` 覆盖发布目录和分支；设置 `JANUS_DEPLOY_SKIP_SYNC=1` 可部署服务器当前已经检出的提交。脚本不会自动删除旧 release，以便手动回滚。

详细边界与 Electron 演进方式见 [架构说明](docs/architecture.md)。
