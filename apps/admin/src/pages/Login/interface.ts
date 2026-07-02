/**
 * 登录请求参数。
 */
export interface LoginParams {
	username: string;
	password: string;
}

/**
 * 登录接口响应。
 */
export interface LoginResponse {
	code: number;
	msg?: string;
	token?: string;
}
