# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Janus 当前面向 AzurPilot 实例的所有者本人。用户通常从桌面浏览器远程查看并管理部署在服务器上的游戏自动化实例，后续也会通过 Electron 桌面端完成同样的工作。

## Product Purpose

Janus 为 AzurPilot 的 Python 核心提供独立的现代客户端界面。它通过稳定 API 展示运行状态、实例、任务、配置、日志和实时预览，并让客户端界面的演进不阻碍 AzurPilot 核心、OCR 与游戏识别逻辑持续跟进上游。

## Positioning

Janus 不复制或改写 AzurPilot 的游戏逻辑，而是把 AzurPilot 暴露的能力组织成可由 Web 与 Electron 共同消费的类型化数据层和操作界面。

## Operating Context

- AzurPilot 部署在远程服务器，并由独立的 guard 或反向代理层负责外网鉴权。
- Web 客户端在本地开发时通过 Vite 代理访问 API，部署后从独立域名访问受保护的服务。
- 用户需要快速判断服务是否可用、有哪些实例在运行、当前任务状态以及核心运行环境。

## Capabilities and Constraints

- 当前 API 已提供健康状态、系统信息、实例、任务、配置与日志等数据。
- 实时截图等连续内容后续使用适合流式数据的传输方式，不强制通过普通 REST 轮询承载。
- Web 与 Electron 必须尽量复用 API 客户端、查询逻辑、业务组件和 UI 基础设施。
- Janus 不承担外层身份认证的实现，但客户端请求必须兼容基于 Cookie 或代理的鉴权。
- 不在界面中伪造未由 API 提供的游戏进度、性能指标或账号状态。

## Brand Commitments

- 产品名称为 Janus。
- 操作界面采用用户明确指定的 iOS / iPadOS 设计语言，包括大圆角、层次清晰的半透明材质与背景模糊。
- 界面应克制、易扫描，避免通用 AI 仪表盘常见的紫色渐变、满屏等权卡片和装饰性数据图表。

## Evidence on Hand

- 类型化 API 契约位于 `packages/api-client/src/contracts.ts`。
- 可复用 TanStack Query 查询位于 `packages/features/src/queries.ts`。
- 当前首页位于 `apps/web/src/routes/index.tsx`，尚未形成成熟视觉系统。
- 当前没有可用于界面的品牌图像、真实游戏截图或商业证明素材；后续不得将演示占位内容伪装成真实数据。

## Product Principles

- 先让运行状态和下一步操作一眼可见。
- 以真实服务数据驱动界面，错误、加载和空状态同样是一等状态。
- 保持客户端与 AzurPilot 游戏核心解耦，以便两边独立升级。
- 为 Web 与 Electron 建立同一套可复用业务边界。
- 视觉表达服务于长时间操作，不牺牲信息清晰度。
