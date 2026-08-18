---
version: 1
slug: "apps-web-src-routes-index-tsx"
primary_target: "apps/web/src/routes/index.tsx"
related_targets: ["packages/features/src/dashboard.tsx"]
---

# Dashboard

- Scope: Janus Web 首页；Operate 模式。
- Audience and job: AzurPilot 实例所有者需要在一次扫描中确认服务可用、实例运行状态、当前任务和核心环境。
- Content and constraints: 只展示 health、system、instances、tasks 的真实 API 数据；保留加载、失败和空状态；同一业务组件可供 Electron 复用。
- Direction: 用户指定的 iPadOS 远程控制台。浅冷色环境光包裹磨砂分栏，港湾蓝概览面承担服务状态，其余内容使用清晰列表而非指标卡阵列。
- Memorable moment: 蓝色服务概览把“服务在线、运行实例、当前选择”合成一个远程值守判断面。
- Unresolved: 实时截图、日志流与具体控制动作后续进入独立界面，不在本次首页中伪造入口。
