/**
 * 在 apps/<name> 下执行 package.json scripts，不经过 pnpm install / modules purge。
 *
 * 场景：在有网环境（如 Mac）装好依赖后，整包拷到断网银河麒麟启动 / 打包。
 * node_modules/.modules.yaml 中的 storeDir 是安装机绝对路径，pnpm 会提示
 * “modules directories will be removed and reinstalled from scratch”；离线重装会失败。
 * 本脚本直接走本地 .bin，避开该校验。
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const [, , appName, scriptName = "dev", ...extraArgs] = process.argv;

if (!appName) {
	console.error(
		"Usage: node scripts/run-app-script.mjs <app> [script] [...args]",
	);
	process.exit(1);
}

const appDir = path.join(rootDir, "apps", appName);
const pkgPath = path.join(appDir, "package.json");

if (!existsSync(pkgPath)) {
	console.error(`App not found: ${appDir}`);
	process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const script = pkg.scripts?.[scriptName];

if (!script) {
	console.error(`Script "${scriptName}" not found in ${pkgPath}`);
	process.exit(1);
}

const pathEnv = [
	path.join(appDir, "node_modules", ".bin"),
	path.join(rootDir, "node_modules", ".bin"),
	process.env.PATH ?? "",
].join(path.delimiter);

const command =
	extraArgs.length > 0 ? `${script} ${extraArgs.join(" ")}` : script;

const child = spawn(command, {
	cwd: appDir,
	stdio: "inherit",
	shell: true,
	env: {
		...process.env,
		PATH: pathEnv,
	},
});

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 1);
});
