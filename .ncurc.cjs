/**
 * .ncurc.cjs — npm-check-updates（ncu）配置
 *
 * 作用：
 *   在仓库根目录执行 `pnpm ncu` / `pnpm ncu:update` 时，由 ncu 自动读取本文件。
 *
 * 行为说明：
 *   - workspaces: 检查根 package.json + pnpm-workspace.yaml 中声明的全部子包
 *   - dep: 检查 prod / dev / peer，以及 pnpm catalog（pnpm-workspace.yaml 内版本）
 *
 * 注意：
 *   - `pnpm ncu` 仅输出可升级版本，不修改文件
 *   - `pnpm ncu:update` 会写回 package.json / catalog，可能丢失 YAML 部分注释，升级后请 diff
 */

module.exports = {
	workspaces: true,
	dep: "prod,dev,peer,catalog",
};
