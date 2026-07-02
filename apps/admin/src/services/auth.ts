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
