import type { LoginParams } from "./interface";

/**
 * localStorage 中「记住我」表单数据的存储键。
 */
const LOGIN_REMEMBER_ME_KEY = "login_remember_me";

/**
 * 读取 localStorage 中「记住我」表单数据，供登录页回显。
 *
 * @returns {Partial<LoginParams> | null} - 含 username、password 且 remember 为 true 的表单片段；无数据、缺少用户名或解析失败时返回 null。
 */
export const getRememberMe = (): Partial<LoginParams> | null => {
	try {
		const raw = localStorage.getItem(LOGIN_REMEMBER_ME_KEY);
		if (!raw) return null;

		const saved = JSON.parse(raw) as Pick<
			LoginParams,
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
 * 根据「记住我」勾选状态，持久化或清除 localStorage 中的表单数据。
 *
 * @param {LoginParams} - 登录表单值；remember 为 true 时写入 username、password，否则清除已存数据。
 * @returns {void} - 无返回值。
 */
export const setRememberMe = (values: LoginParams) => {
	if (values.remember) {
		const data = JSON.stringify({
			username: values.username,
			password: values.password,
		});
		localStorage.setItem(LOGIN_REMEMBER_ME_KEY, data);
		return;
	}

	localStorage.removeItem(LOGIN_REMEMBER_ME_KEY);
};
