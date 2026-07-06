import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

/**
 * 本地联调后端地址兜底值（花生壳等内网穿透工具的临时域名）。
 * 仅在未配置 DEV_PROXY_TARGET 时使用；域名失效时改 .env.development
 * 或本地 .env.development.local，不要直接改这里。
 */
const FALLBACK_DEV_PROXY_TARGET = "http://115111ob8gw23.vicp.fun:48041";

// server.proxy / preview.proxy 仅在本地 `vite dev`、`vite preview` 时生效，
// 不会打进生产构建；线上由 .env.production 的 VITE_API_BASE_URL
// 配合 Nginx 等反向代理指向真实后端。
export default defineConfig(({ mode }) => {
	// 不加 VITE_ 前缀：仅供 vite.config.ts 在 Node 侧读取，不会被打进客户端产物
	const env = loadEnv(mode, process.cwd(), "");
	// preview 的 mode 为 production，仍复用 development 里的 DEV_PROXY_TARGET
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
			port: 1111,
			proxy: apiProxy,
			cors: true,
		},
		preview: {
			port: 4173,
			proxy: apiProxy,
		},
	};
});
