import { create } from "zustand";
import { getRouters } from "./menuApi";
import {
	buildAppMenus,
	parseRouterResponse,
	type TopMenuItem,
} from "./menuConfig";

/** localStorage 中缓存菜单数据的键名。 */
const MENU_CACHE_KEY = "app_menus_v2";

/** 从 localStorage 读取缓存的菜单数据。 */
const getMenuCache = (): TopMenuItem[] => {
	try {
		const raw = localStorage.getItem(MENU_CACHE_KEY);
		return raw ? (JSON.parse(raw) as TopMenuItem[]) : [];
	} catch {
		return [];
	}
};

/**
 * 将菜单数据写入 localStorage 缓存。
 *
 * @param {TopMenuItem[]} - 已转换成前端结构的菜单数据。
 * @returns {void} - 无返回值。
 */
const setMenuCache = (menus: TopMenuItem[]): void => {
	localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(menus));
};

/** 清除 localStorage 中的菜单缓存。 */
const clearMenuCache = (): void => {
	localStorage.removeItem(MENU_CACHE_KEY);
};

interface MenuState {
	menus: TopMenuItem[];
	loading: boolean;
	loaded: boolean;
	fetchMenus: (options?: { force?: boolean }) => Promise<void>;
	clearMenus: () => void;
}

const cachedMenus = getMenuCache();

export const useMenuStore = create<MenuState>((set, get) => ({
	menus: cachedMenus,
	loading: false,
	loaded: cachedMenus.length > 0,
	fetchMenus: async (options) => {
		if (get().loading || (!options?.force && get().loaded)) return;
		set({ loading: true });
		try {
			const data = await getRouters();
			const menus = buildAppMenus(parseRouterResponse(data));
			setMenuCache(menus);
			set({
				menus,
				loaded: true,
			});
		} finally {
			set({ loading: false });
		}
	},
	clearMenus: () => {
		clearMenuCache();
		set({
			menus: [],
			loading: false,
			loaded: false,
		});
	},
}));
