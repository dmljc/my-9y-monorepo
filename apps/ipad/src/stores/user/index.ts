import { create } from "zustand";
import { clearToken, setToken } from "@/utils";
import { login as loginApi, logout as logoutApi } from "./api";
import type { LoginParams, UserInfo } from "./interface";

/** localStorage 中缓存用户信息的键名。 */
const USER_CACHE_KEY = "user_info";

/** 缓存中的用户数据结构。 */
interface UserCache {
	user: UserInfo;
	permissions: string[];
	roles: string[];
}

/** 从 localStorage 读取缓存的用户信息。 */
const getUserCache = (): UserCache | null => {
	try {
		const raw = localStorage.getItem(USER_CACHE_KEY);
		return raw ? (JSON.parse(raw) as UserCache) : null;
	} catch {
		return null;
	}
};

/** 将用户信息写入 localStorage 缓存。 */
const setUserCache = (cache: UserCache): void => {
	localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cache));
};

/** 清除 localStorage 中的用户缓存。 */
const clearUserCache = (): void => {
	localStorage.removeItem(USER_CACHE_KEY);
};

/**
 * 由登录账号构造本地会话用户（ipad 不调用 getInfo）。
 *
 * @param {string} - 登录用户名。
 * @returns {UserInfo} - 本地会话用户。
 */
const buildSessionUser = (username: string): UserInfo => {
	const userName = username.trim();
	return {
		userId: 0,
		userName,
		nickName: userName,
	};
};

/**
 * 用户 store 状态与操作方法。
 */
interface UserState {
	user: UserInfo | null;
	permissions: string[];
	roles: string[];
	loading: boolean;
	login: (params: LoginParams) => Promise<boolean>;
	logout: () => Promise<void>;
	restoreUser: () => boolean;
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

export const useUserStore = create<UserState>((set) => ({
	...defaultUserState,
	/**
	 * 登录：仅调用 POST /login，持久化 token，并用登录账号写入本地会话（不调 getInfo / getRouters）。
	 *
	 * @param {LoginParams} - 账号与密码。
	 * @returns {boolean} - 登录成功时返回 true，否则 false。
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
			const user = buildSessionUser(params.username);
			setUserCache({
				user,
				permissions: [],
				roles: [],
			});
			set({
				user,
				permissions: [],
				roles: [],
			});
			return true;
		} catch {
			clearToken();
			set(defaultUserState);
			return false;
		} finally {
			set({ loading: false });
		}
	},
	/**
	 * 退出登录：调用登出接口使服务端 token 失效，并清空本地 token 与用户缓存。
	 * 接口失败时仍清理本地状态，保证用户可退出。
	 *
	 * @returns {void} - 无返回值。
	 */
	logout: async () => {
		try {
			await logoutApi();
		} catch {
			// 接口失败仍清理本地态
		} finally {
			clearToken();
			clearUserCache();
			set(defaultUserState);
		}
	},
	/**
	 * 从 localStorage 缓存恢复用户信息（不发起网络请求）。
	 *
	 * @returns {boolean} - 缓存存在且恢复成功时返回 true。
	 */
	restoreUser: () => {
		const cached = getUserCache();
		if (!cached) return false;
		set({
			user: cached.user,
			permissions: cached.permissions,
			roles: cached.roles,
		});
		return true;
	},
	/**
	 * 清空用户信息、权限、角色、loading 状态与本地缓存。
	 *
	 * @returns {void} - 无返回值。
	 */
	clearUser: () => {
		clearUserCache();
		set(defaultUserState);
	},
}));
