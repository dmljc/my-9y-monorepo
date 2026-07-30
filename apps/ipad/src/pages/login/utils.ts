import type { LoginFormValues } from "./interface";

/**
 * 用户账号最大字符数。
 */
export const USERNAME_MAX_LENGTH = 30;

/**
 * 密码最小字符数。
 */
export const PASSWORD_MIN_LENGTH = 5;

/**
 * 密码最大字符数。
 */
export const PASSWORD_MAX_LENGTH = 20;

/**
 * 账号允许字符：字母、数字、@。
 */
export const USERNAME_PATTERN = /^[A-Za-z0-9@]+$/;

/**
 * 密码允许字符：字母、数字及常见符号。
 */
export const PASSWORD_PATTERN = /^[A-Za-z0-9!@#$%^&*._-]+$/;

/**
 * localStorage 中「记住我」表单数据的存储键。
 */
const REMEMBER_ME_KEY = "ipad_remember_me";

/**
 * 读取 localStorage 中「记住我」表单数据，供登录页回显。
 *
 * @returns {Partial<LoginFormValues> | null} - 含 username、password 且 remember 为 true 的表单片段；无数据、缺少用户名或解析失败时返回 null。
 */
export const getRememberMe = (): Partial<LoginFormValues> | null => {
	try {
		const raw = localStorage.getItem(REMEMBER_ME_KEY);
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
 * 根据「记住我」勾选状态，持久化或清除 localStorage 中的表单数据。
 *
 * @param {LoginFormValues} - 登录表单值；remember 为 true 时写入 username、password，否则清除已存数据。
 * @returns {void} - 无返回值。
 */
export const setRememberMe = (values: LoginFormValues) => {
	if (values.remember) {
		const data = JSON.stringify({
			username: values.username,
			password: values.password,
		});
		localStorage.setItem(REMEMBER_ME_KEY, data);
		return;
	}

	localStorage.removeItem(REMEMBER_ME_KEY);
};
