# Janus 架构

## 当前决策

- 使用 pnpm workspace + Turborepo 管理 Web、Electron 和共享包。
- Web 使用 TanStack Start，但开启 `spa.enabled`；当前不依赖 SSR 或 Start server functions。
- AzurPilot 保持独立部署，Janus 只消费其版本化 REST API。
- 不复制 AzurPilot 的 Python/OCR/游戏逻辑，因此 Python 核心可以继续独立同步上游。
- Electron 暂时只保留目录；共享层不得假定浏览器或 Electron 环境。

## 依赖方向

```text
apps/web ──────┬──> packages/features ──> packages/api-client
               └──> packages/ui

apps/electron（未来）使用同一组共享包，并替换运行时 transport
```

`packages/api-client` 定义接口契约、`JanusApiClient` 和 `ApiTransport`。当前 Web 注入 `FetchTransport`；Electron 将来可继续使用 HTTP，也可实现一个仅暴露白名单方法的 IPC transport。业务包只依赖客户端接口，不直接读取 `window`、环境变量或 Electron API。

`packages/features` 存放 Query keys、query options、表单 schema、表格列定义和业务状态机。页面只做路由参数、运行时依赖与 UI 的组装。高频服务端状态属于 TanStack Query；仅客户端且跨页面的轻量状态再考虑 TanStack Store。

`packages/ui` 只包含通用组件和 token，不依赖路由、业务查询或平台 API。Storybook 使用 CSF Next factory 写法（`defineMain`、`definePreview`、`preview.meta`、`meta.story`）。

## 目录组织

目录采用“工作区按职责、工作区内部按领域”的混合方式。路由文件只负责 URL 参数和页面入口，业务实现不平铺到 `apps/web/src`。

```text
apps/web/src/
├── components/                 # Web 运行时、Provider 与页面适配器
└── routes/                     # TanStack Router 路由入口；保持轻量

packages/features/src/
├── api/                        # Query keys 与 query options
├── dashboard/
│   ├── components/             # 仅供仪表盘使用的展示组件
│   └── dashboard.tsx           # 仪表盘编排入口
└── instance-detail/
    ├── components/             # 概览、任务、配置、日志等面板
    ├── instance-detail.tsx      # 查询编排与标签页分发
    ├── instance-detail-tabs.ts  # 领域类型
    └── instance-detail-utils.ts # 纯函数与解析逻辑

packages/ui/
├── src/components/             # shadcn 基础组件与无业务依赖的公共组件
└── stories/
    ├── components/shadcn/      # shadcn 基础组件 stories / MDX
    └── business/               # Janus 组合组件 stories / MDX
```

新增代码遵循以下规则：

- 路由文件超过参数校验与适配职责时，将实现下沉到 `packages/features`。
- 一个领域入口负责请求与状态编排；可独立描述、测试或写 Story 的区域拆为 `components`。
- 领域私有组件与领域同目录放置，不通过包级 exports 暴露；跨领域复用后才提升到公共层。
- 测试与被测文件就近放置，避免单独的全局 tests 目录失去上下文。
- 内部代码直接导入具体文件，不新增层层转发的 barrel；包外只通过 `package.json#exports` 访问稳定入口。
- Storybook 的文件路径与 `title` 同时表达分类，避免 shadcn 基础组件和 Janus 业务组件重名。

参考：[TanStack Router 文件式路由](https://tanstack.com/router/latest/docs/routing/file-based-routing)、[Storybook 组件层级](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy)、[shadcn monorepo](https://ui.shadcn.com/docs/monorepo)。

## Web 请求与鉴权边界

默认 API base URL 为同源 `/api/v1`，`FetchTransport` 固定发送 JSON Accept 并使用 `credentials: "include"`。如果 Guard/Caddy 返回登录 HTML，客户端会将其识别为非 JSON 响应，而不会把登录页面误当业务数据。

分离域名部署时可设置 `VITE_JANUS_API_BASE_URL`。鉴权、CORS、CSRF 与 WebSocket 凭据仍由外层 Guard 和服务端负责，前端不保存长期 API 密钥。建议优先同站 Cookie；若必须使用 token，应只由平台 transport 提供，避免散落在业务组件中。

## 实时日志与截图

- 低频日志列表可以通过 Query 轮询；日志流建立单独的 stream adapter。
- 实时截图先通过 `GET /api/v1/instances/{instance}/live-screenshot` 获取稳定的媒体连接描述，再连接描述中的 WebSocket；REST 不承载截图帧。
- 截图预览不得写入 Query cache、TanStack Store 或逐帧 React state。
- JPEG/WebP 帧使用独立订阅器和单一 `<img>`/canvas 容器，及时回收旧 Object URL。
- H.264 使用 WebCodecs/MSE 或现有播放器 adapter，媒体数据不经过 JSON REST。
- WebSocket/媒体连接由平台 runtime 创建，以便 Web 注入带 Guard 凭据的 URL，Electron 将来改用 preload IPC 或本地连接。
- 页面卸载、实例切换和网络重连时必须显式停止 decoder、reader、timer 与 socket。
- Web 运行时优先使用 WebCodecs 解码 scrcpy 的原始 H.264；浏览器不支持或解码失败时自动以 `mode=screenshot` 重连，使用 Safari 兼容的 fragmented MP4 + MSE。
- 浮窗位于持久 Dashboard 外壳中，路由切换不会重建；最小化或关闭会卸载媒体 Surface 并释放连接。

## Electron 后续约束

Electron main/preload/renderer 分层实现。保持 `contextIsolation: true`、`nodeIntegration: false` 与 sandbox，preload 只暴露有限的、带类型的 Janus API。renderer 继续使用 `packages/features` 与 `packages/ui`，不得直接导入 Node/Electron 模块。

## SSR 何时启用

当前管理端依赖登录态且数据实时性高，SSR 收益较小，SPA 更简单。只有出现公开可索引页面、首屏性能明确受限，或需要服务端隐藏第三方凭据时，再逐路由启用 SSR；共享包边界无需因此重写。
