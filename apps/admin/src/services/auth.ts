/**
 * localStorage 中 access token 的存储键。
 */
export const AUTH_TOKEN_KEY = "admin_access_token";

/**
 * 本应用内清除 token 时派发的自定义事件名。
 */
export const AUTH_LOGOUT_EVENT = "admin-auth-logout";

/**
 * 读取已保存的 access token。
 *
 * @returns {string | null} - 已保存的 token；未登录时返回 null。
 */
export const getToken = (): string | null =>
	localStorage.getItem(AUTH_TOKEN_KEY);

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
	localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * 清除 access token。
 *
 * @returns {void} - 无返回值。
 */
export const clearToken = () => {
	localStorage.removeItem(AUTH_TOKEN_KEY);
	window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
};
