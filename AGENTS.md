# Janus 项目约束

## 工具链

- 仅使用 `pnpm` 管理依赖，禁止提交 npm/yarn/bun 锁文件。
- 格式化、Lint 和 import 排序统一使用根目录 Biome，禁止新增 ESLint 或 Prettier。
- TypeScript 必须保持 strict；跨包代码通过 workspace package exports 引用。
- 新依赖应安装到实际使用它的 workspace，只有全仓工具才放在根目录。

## 架构边界

- `apps/web` 是 TanStack Start 的 SPA 模式入口；不要在共享包中依赖 Start 服务端 API。
- `apps/electron` 暂时保留，未来 main/preload 代码不得泄漏到 renderer 或公共包。
- 可复用业务逻辑放入 `packages/features`，API 契约与传输抽象放入 `packages/api-client`。
- 公共 UI 放入 `packages/ui`；不要在组件库中引入具体业务、路由或远程数据请求。
- 高频截图帧不得写入 React state、TanStack Query 或持久化 Store。
- Web 与 Electron 的环境差异必须通过显式 runtime/transport 接口隔离，禁止在共享组件中直接访问 Electron API。

## UI 约束

- 当前阶段只维护 Tailwind CSS v4、shadcn/ui 和 Storybook 基础设施。
- 未经明确需求，不添加业务视觉风格、品牌配色、复杂布局或动画。
- shadcn 初始化保持 `--pointer` 行为：未禁用的 button 和 `[role="button"]` 使用 pointer cursor。

## 提交规范

提交信息遵循 Conventional Commits：`type(scope): description`。

允许的 scope：`repo`、`deps`、`web`、`electron`、`ui`、`api`、`storybook`、`docs`。

示例：

- `feat(web): add instance route shell`
- `fix(api): handle unauthorized responses`
- `chore(deps): update tanstack packages`

提交前运行 `pnpm check` 和受影响 workspace 的类型检查、测试与构建。
