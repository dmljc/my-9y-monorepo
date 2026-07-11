import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

/**
 * 本地联调后端地址兜底值。
 * 仅在未配置 DEV_PROXY_TARGET 时使用；域名失效时改 .env.development
 * 或本地 .env.development.local，不要直接改这里。
 */
const FALLBACK_DEV_PROXY_TARGET = "http://115111ob8gw23.vicp.fun:48041";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const devEnv = loadEnv("development", process.cwd(), "");
	const proxyTarget =
		env.DEV_PROXY_TARGET ||
		devEnv.DEV_PROXY_TARGET ||
		FALLBACK_DEV_PROXY_TARGET;

	const apiProxy = {
		"/api": {
			target: proxyTarget,
			changeOrigin: true,
		},
	};

	return {
		plugins: [react()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
				"@utils": path.resolve(__dirname, "../../utils"),
			},
		},
		server: {
			port: 2222,
			proxy: apiProxy,
			cors: true,
		},
		preview: {
			port: 4174,
			proxy: apiProxy,
		},
	};
});
