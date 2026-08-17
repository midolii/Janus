# Janus

面向 AzurPilot REST API 的 Web 与 Electron 双端客户端 monorepo。

## Workspace

```text
apps/
  web/          TanStack Start SPA
  electron/     Electron 预留入口
packages/
  api-client/   REST 传输、契约和运行时边界
  features/     可复用业务功能
  ui/           Tailwind v4 + shadcn/ui + Storybook
```

项目处于基础设施阶段，暂不定义最终业务视觉样式。
