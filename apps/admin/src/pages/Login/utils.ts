/**
 * 登录表单字段。
 */
export interface LoginFormValues {
	username: string;
	password: string;
	remember?: boolean;
}

/**
 * localStorage 中「记住我」凭证的存储键。
 */
const LOGIN_CREDENTIALS_KEY = "admin_login_credentials";

/**
 * 读取 localStorage 中已保存的登录凭证，供表单回显。
 *
 * @returns {Partial<LoginFormValues> | null} - 含 username、password 且 remember 为 true 的表单片段；无数据、缺少用户名或解析失败时返回 null。
 */
export const loadSavedCredentials = (): Partial<LoginFormValues> | null => {
	try {
		const raw = localStorage.getItem(LOGIN_CREDENTIALS_KEY);
		if (!raw) return null;

		const saved = JSON.parse(raw) as Pick<
			LoginFormValues,
			"username" | "password"
		>;
		if (!saved.username) return null;

		return {
			username: saved.username,
			password: saved.password ?? "",
			remember: true,
		};
	} catch {
		return null;
	}
};

/**
 * 根据「记住我」勾选状态，持久化或清除 localStorage 中的登录凭证。
 *
 * @param {LoginFormValues} - 登录表单值；remember 为 true 时写入 username、password，否则清除已存凭证。
 * @returns {void} - 无返回值。
 */
export const saveCredentials = (values: LoginFormValues) => {
	if (values.remember) {
		localStorage.setItem(
			LOGIN_CREDENTIALS_KEY,
			JSON.stringify({
				username: values.username,
				password: values.password,
			}),
		);
		return;
	}

	localStorage.removeItem(LOGIN_CREDENTIALS_KEY);
};
