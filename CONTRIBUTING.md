# Contributing

## 环境

- Node.js 24（最低支持 22.12）
- pnpm 11

安装依赖并验证：

```bash
pnpm install
pnpm validate
```

## Conventional Commits

本项目使用 Conventional Commits，并通过 commitlint 与 Husky 校验提交信息。

格式：

```text
type(scope): description
```

常用 type 包括 `feat`、`fix`、`refactor`、`test`、`docs`、`build`、`ci` 和 `chore`。

## 代码质量

```bash
pnpm check
pnpm check:write
pnpm typecheck
pnpm test
pnpm build
```

全仓只使用根目录的 Biome 配置，不额外引入 ESLint 或 Prettier。
