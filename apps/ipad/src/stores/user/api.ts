import mockdata from "@/mock/mockdata.json";
import type { GetInfoResponse, LoginParams, LoginResponse } from "./interface";

/**
 * 模拟网络延迟（后端接口就绪后可删除）。
 *
 * @param {number} - 延迟毫秒数。
 * @returns {Promise<void>} - 延迟结束后 resolve。
 */
const delay = (ms = 200) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});

/**
 * 本地 mock 登录（后端未提供接口前使用；任意通过表单校验的账号均可登录）。
 *
 * @param {LoginParams} - 账号与密码（仅用于回填用户展示名，不校验真伪）。
 * @returns {Promise<LoginResponse>} - 含 token 的登录结果。
 */
export const login = async (data: LoginParams): Promise<LoginResponse> => {
	await delay();
	const username = data.username.trim();
	if (!username || !data.password) {
		throw new Error("请输入用户名和密码");
	}
	return {
		code: 200,
		msg: "登录成功",
		token: mockdata.token,
	};
};

/**
 * 本地 mock 拉取用户信息（后端未提供接口前使用 mockdata.json）。
 *
 * @returns {Promise<GetInfoResponse>} - 用户、权限与角色。
 */
export const getInfo = async (): Promise<GetInfoResponse> => {
	await delay();
	return {
		code: 200,
		msg: "操作成功",
		permissions: mockdata.userInfo.permissions,
		roles: mockdata.userInfo.roles,
		user: mockdata.userInfo.user,
	};
};
