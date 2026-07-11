import { createHttpClient } from "@utils/http-client";
import type { MessageInstance } from "antd/es/message/interface";

/** 供 main.tsx 注入 App.useApp().message，供 onError 弹出错误提示。 */
export const requestMessageApi: { current: MessageInstance | null } = {
	current: null,
};

/**
 * 读取已保存的 access token。
 *
 * @returns {string | null} - 已保存的 token；未登录时返回 null。
 */
export const getToken = (): string | null => localStorage.getItem("token");

/**
 * 持久化 access token。
 *
 * @param {string} - 登录接口返回的 token。
 * @returns {void} - 无返回值。
 */
export const setToken = (token: string | undefined) => {
	if (!token) {
		clearToken();
		return;
	}
	localStorage.setItem("token", token);
};

/**
 * 清除 access token。
 *
 * @returns {void} - 无返回值。
 */
export const clearToken = () => {
	localStorage.removeItem("token");
};

/**
 * 创建 HTTP 客户端实例。
 *
 * @returns {HttpClient} - HTTP 客户端实例。
 */
export const request = createHttpClient({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	getToken: () => getToken(),
	onUnauthorized: () => {
		clearToken();
		if (!window.location.pathname.startsWith("/login")) {
			window.location.href = "/login";
		}
	},
	onError: (error) =>
		requestMessageApi.current?.error(error.message || "请求失败"),
});
