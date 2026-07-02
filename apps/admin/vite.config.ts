import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@utils": path.resolve(__dirname, "../../utils"),
		},
	},
	server: {
		port: 1111,
		proxy: {
			"/api": {
				target: "http://115111ob8gw23.vicp.fun:48041",
				changeOrigin: true,
			},
		},
		cors: true,
	},
});
