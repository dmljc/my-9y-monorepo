import { create } from "zustand";
import { clearToken, setToken } from "@/utils";
import { getInfo, login as loginApi } from "./api";
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
 * 用户 store 状态与操作方法。
 */
interface UserState {
	user: UserInfo | null;
	permissions: string[];
	roles: string[];
	loading: boolean;
	login: (params: LoginParams) => Promise<boolean>;
	fetchUserInfo: () => Promise<boolean>;
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

export const useUserStore = create<UserState>((set, get) => ({
	...defaultUserState,
	/**
	 * 登录并拉取用户信息：走本地 mock（mockdata.json），持久化 token 后再取 getInfo。
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
		} finally {
			set({ loading: false });
		}
	},
	/**
	 * 根据当前 token 拉取用户信息、权限与角色（本地 mock），成功后写入 localStorage 缓存。
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
			setUserCache({
				user: data.user,
				permissions: data.permissions ?? [],
				roles: data.roles ?? [],
			});
			set({
				user: data.user,
				permissions: data.permissions ?? [],
				roles: data.roles ?? [],
			});
			return true;
		} catch {
			set(defaultUserState);
			return false;
		} finally {
			set({ loading: false });
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
