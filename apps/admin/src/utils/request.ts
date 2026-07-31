import { createHttpClient } from "@utils/http-client";
import type { MessageInstance } from "antd/es/message/interface";
import { useUnauthorizedStore } from "@/stores/unauthorized";

/** 供 main.tsx 注入 App.useApp()，供请求层显示全局反馈。 */
export const requestMessageApi: { current: MessageInstance | null } = {
	current: null,
};

/** localStorage 中 token 的存储键。 */
const TOKEN_KEY = "admin_token";
/** 与 stores/user 中 USER_CACHE_KEY 保持一致。 */
const USER_CACHE_KEY = "admin_user_info";
/** 与 layout/menuStore 中 MENU_CACHE_KEY 保持一致。 */
const MENU_CACHE_KEY = "admin_menus";

/**
 * 读取已保存的 access token。
 *
 * @returns {string | null} - 已保存的 token；未登录时返回 null。
 */
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

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
	localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 清除 access token。
 *
 * @returns {void} - 无返回值。
 */
export const clearToken = () => {
	localStorage.removeItem(TOKEN_KEY);
};

/**
 * 清理 token 失效后的本地会话缓存。
 *
 * @returns {void} - 无返回值。
 */
export const clearExpiredSession = () => {
	clearToken();
	localStorage.removeItem(USER_CACHE_KEY);
	localStorage.removeItem(MENU_CACHE_KEY);
};

/**
 * token 失效时显示全局重新登录确认框。
 *
 * @returns {void} - 无返回值。
 */
const handleUnauthorized = () => {
	if (window.location.pathname.startsWith("/login")) return;
	useUnauthorizedStore.getState().show();
};

/**
 * 创建 HTTP 客户端实例。
 *
 *  @returns {HttpClient} - HTTP 客户端实例。
 *
 * @example
 * ```ts
 * const users = await request.get<User[]>("/user/list");
 * console.log(users);
 * ```
 */
export const request = createHttpClient({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	getToken: () => getToken(),
	onUnauthorized: handleUnauthorized,
	onError: (error) =>
		requestMessageApi.current?.error(error.message || "请求失败"),
});
