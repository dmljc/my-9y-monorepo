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

/**
 * 用户基本信息。
 */
export interface UserInfo {
	userId: number;
	userName: string;
	nickName: string;
	email?: string;
	phonenumber?: string;
	avatar?: string | null;
}

/**
 * getInfo 接口响应。
 */
export interface GetInfoResponse {
	code: number;
	msg?: string;
	permissions: string[];
	roles: string[];
	user: UserInfo;
}
