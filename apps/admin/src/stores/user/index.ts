import { create } from "zustand";
import { clearToken, setToken } from "@/utils/request";
import { getInfo, login as loginApi } from "./api";
import type { LoginParams, UserInfo } from "./interface";

/**
 * 用户 store 状态与操作方法。
 */
interface UserState {
	user: UserInfo | null;
	permissions: string[];
	roles: string[];
	loading: boolean;
	login: (params: LoginParams) => Promise<boolean>;
	fetchUserInfo: () => Promise<boolean>;
	clearUser: () => void;
}

/**
 * 用户 store 的默认状态，用于初始化与重置。
 */
const defaultUserState = {
	user: null,
	permissions: [] as string[],
	roles: [] as string[],
	loading: false,
};

export const useUserStore = create<UserState>((set, get) => ({
	...defaultUserState,
	/**
	 * 登录并拉取用户信息：调用登录接口、持久化 token、再请求 getInfo。
	 *
	 * @param {LoginParams} - 账号与密码。
	 * @returns {boolean} - 登录且用户信息加载成功时返回 true，否则 false。
	 */
	login: async (params) => {
		set({ loading: true });
		try {
			const data = await loginApi(params);
			if (data.code !== 200 || !data.token) {
				set(defaultUserState);
				return false;
			}
			setToken(data.token);
			const ok = await get().fetchUserInfo();
			if (!ok) {
				clearToken();
			}
			return ok;
		} catch {
			clearToken();
			set(defaultUserState);
			return false;
		}
	},
	/**
	 * 根据当前 token 拉取用户信息、权限与角色。
	 *
	 * @returns {boolean} - 获取成功时返回 true，否则 false。
	 */
	fetchUserInfo: async () => {
		set({ loading: true });
		try {
			const data = await getInfo();
			if (data.code !== 200 || !data.user) {
				set(defaultUserState);
				return false;
			}
			set({
				user: data.user,
				permissions: data.permissions ?? [],
				roles: data.roles ?? [],
				loading: false,
			});
			return true;
		} catch {
			set(defaultUserState);
			return false;
		}
	},
	/**
	 * 清空用户信息、权限、角色与 loading 状态。
	 *
	 * @returns {void} - 无返回值。
	 */
	clearUser: () => {
		set(defaultUserState);
	},
}));
