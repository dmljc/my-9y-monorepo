# frontend-project-template

**pnpm Monorepo** 前端项目模板

- **技术栈**：React 19 · Ant Design 6 · Vite 8 · TypeScript 6
- **依赖版本**：`pnpm-workspace.yaml` → **catalog** 统一维护；子包写 `"catalog:"` 引用

## 目录

```
apps/admin                 # 管理后台
apps/dashboard             # 可视化大屏
utils/http-client          # axios 封装，@utils/http-client
.cursor/rules/             # Cursor 规则（admin 页面约定）
```

## 快速开始

环境：Node 20+、pnpm 9+（仓库根目录执行）。

```bash
pnpm install
pnpm admin:dev
pnpm dashboard:dev
```

| 脚本 | 作用 |
|------|------|
| `pnpm admin:build` / `dashboard:build` | 各子包生产构建 |
| `pnpm lint` / `lint:fix` | 全仓库 Biome 检查 / 自动修复 |
| `pnpm commit` | 交互式提交（cz-git） |
| `pnpm ncu` | 检查可升级依赖（不改动文件） |
| `pnpm ncu:update` | 写入升级；之后 `pnpm install`，并 diff `pnpm-workspace.yaml` |
| `pnpm clean:all-dists` | 删除各包 `dist` |
| `pnpm clean:all-node_modules` | 删除全部 `node_modules` |

## 子项目

| 包 | 端口 | 要点 |
|----|------|------|
| **admin** | 1111 | 路由：`/login`、`/digital-twin`、`/data-management/*`；dev 下 `/api` 代理 `localhost:3000` |
| **dashboard** | 2222 | 大屏；API 代理同 admin |
| **http-client** | — | Token、解包、401；见各 app `vite.config.ts` 别名 |

- admin 编码约定：[.cursor/rules/admin-frontend.mdc](.cursor/rules/admin-frontend.mdc)
- admin 页面示例：`apps/admin/src/pages/Login/`

## 根目录配置文件

| 文件 | 用途 |
|------|------|
| [`package.json`](package.json) | 根脚本（dev/build/lint/ncu 等）、共享 `devDependencies`、lint-staged 规则、commitizen 入口 |
| [`pnpm-workspace.yaml`](pnpm-workspace.yaml) | 声明 workspace 路径（`apps/*`、`packages/*`）；**catalog** 统一版本；`allowBuilds`（允许 @swc/core、esbuild 等安装脚本）；`overrides` / `peerDependencyRules` 解决依赖冲突 |
| [`pnpm-lock.yaml`](pnpm-lock.yaml) | 锁定全仓库依赖树，提交后保证 `pnpm install` 可复现 |
| [`.ncurc.cjs`](.ncurc.cjs) | `pnpm ncu` 配置：检查所有 workspace 子包 + catalog 段（`workspaces`、`dep` 含 catalog） |
| [`biome.json`](biome.json) | 全仓库格式化与 Lint（替代 ESLint+Prettier）；`pnpm lint` 使用 |
| [`commitlint.config.cjs`](commitlint.config.cjs) | 校验 commit message 类型与 **scope**（须与改动目录对应） |
| [`.husky/pre-commit`](.husky/pre-commit) | 提交前跑 `lint-staged`，对暂存文件执行 Biome |
| [`.husky/commit-msg`](.husky/commit-msg) | 提交时跑 commitlint |
| [`.gitattributes`](.gitattributes) | `* text=auto`，统一文本换行，减少 Win/Mac/Linux 混用 diff 噪音 |
| [`.cursor/rules/admin-frontend.mdc`](.cursor/rules/admin-frontend.mdc) | Cursor 编辑 `apps/admin` 时的组件、样式、Ant Design 约定 |

**提交 scope**（与 commitlint 一致）：`apps/admin` · `apps/dashboard` · `utils/http-client` · `global` · `global/config`

## 子应用配置

| 位置 | 用途 |
|------|------|
| `apps/*/vite.config.ts` | 构建、别名（`@/`、`@utils`）、dev 端口与 `/api` 代理 |
| `apps/*/.env.development` | 开发环境变量（仅 `VITE_` 前缀暴露给前端） |
| `apps/*/.env.production` | 生产环境变量 |
| `apps/admin/src/routers/index.tsx` | admin 路由表 |
| `apps/admin/src/layout/menuConfig.ts` | 顶栏 / 侧栏菜单与默认跳转 |

开发 API 示例：`VITE_API_BASE_URL=/api`（配合 Vite 代理到后端）。

## 依赖版本怎么改

1. 多包共用的库：改 `pnpm-workspace.yaml` → `catalog`，再 `pnpm install`
2. 仅某一子包独有：改该子包 `package.json`
3. 检查升级：`pnpm ncu`；确认后 `pnpm ncu:update` 并 review diff
