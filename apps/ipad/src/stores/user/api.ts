import { request } from "@/utils";
import type { GetInfoResponse, LoginParams, LoginResponse } from "./interface";

/**
 * 登录（与 admin 相同：POST /login）。
 *
 * @param {LoginParams} - 账号与密码。
 * @returns {Promise<LoginResponse>} - 含 token 的登录结果。
 */
export const login = (data: LoginParams): Promise<LoginResponse> => {
	return request.post("/login", data);
};

/**
 * 获取当前登录用户信息（GET /getInfo，type=ipad）。
 *
 * @returns {Promise<GetInfoResponse>} - 用户、权限与角色。
 */
export const getInfo = (): Promise<GetInfoResponse> => {
	return request.get("/getInfo", { params: { type: "ipad" } });
};

/**
 * 退出登录（与 admin 相同：POST /logout）。
 *
 * @returns {Promise<void>} - 无业务数据。
 */
export const logout = (): Promise<void> => {
	return request.post("/logout");
};
