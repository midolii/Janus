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

## Web 请求与鉴权边界

默认 API base URL 为同源 `/api/v1`，`FetchTransport` 固定发送 JSON Accept 并使用 `credentials: "include"`。如果 Guard/Caddy 返回登录 HTML，客户端会将其识别为非 JSON 响应，而不会把登录页面误当业务数据。

分离域名部署时可设置 `VITE_JANUS_API_BASE_URL`。鉴权、CORS、CSRF 与 WebSocket 凭据仍由外层 Guard 和服务端负责，前端不保存长期 API 密钥。建议优先同站 Cookie；若必须使用 token，应只由平台 transport 提供，避免散落在业务组件中。

## 实时日志与截图

- 低频日志列表可以通过 Query 轮询；日志流建立单独的 stream adapter。
- 截图预览不得写入 Query cache、TanStack Store 或逐帧 React state。
- JPEG/WebP 帧使用独立订阅器和单一 `<img>`/canvas 容器，及时回收旧 Object URL。
- H.264 使用 WebCodecs/MSE 或现有播放器 adapter，媒体数据不经过 JSON REST。
- WebSocket/媒体连接由平台 runtime 创建，以便 Web 注入带 Guard 凭据的 URL，Electron 将来改用 preload IPC 或本地连接。
- 页面卸载、实例切换和网络重连时必须显式停止 decoder、reader、timer 与 socket。

## Electron 后续约束

Electron main/preload/renderer 分层实现。保持 `contextIsolation: true`、`nodeIntegration: false` 与 sandbox，preload 只暴露有限的、带类型的 Janus API。renderer 继续使用 `packages/features` 与 `packages/ui`，不得直接导入 Node/Electron 模块。

## SSR 何时启用

当前管理端依赖登录态且数据实时性高，SSR 收益较小，SPA 更简单。只有出现公开可索引页面、首屏性能明确受限，或需要服务端隐藏第三方凭据时，再逐路由启用 SSR；共享包边界无需因此重写。
