import { create } from "zustand";
import { getRouters } from "./menuApi";
import {
	buildAppMenus,
	parseRouterResponse,
	type TopMenuItem,
} from "./menuConfig";

interface MenuState {
	menus: TopMenuItem[];
	loading: boolean;
	loaded: boolean;
	fetchMenus: () => Promise<void>;
	clearMenus: () => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
	menus: [],
	loading: false,
	loaded: false,
	fetchMenus: async () => {
		if (get().loading || get().loaded) return;
		set({ loading: true });
		try {
			const data = await getRouters();
			set({
				menus: buildAppMenus(parseRouterResponse(data)),
				loaded: true,
			});
		} finally {
			set({ loading: false });
		}
	},
	clearMenus: () => {
		set({
			menus: [],
			loading: false,
			loaded: false,
		});
	},
}));
