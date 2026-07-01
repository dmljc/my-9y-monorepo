/** 顶部一级菜单 key */
export type TopMenuKey =
	| "dashboard"
	| "statistics"
	| "warning"
	| "device"
	| "historicalData"
	| "modelData"
	| "reverseControl"
	| "permission";

export interface TopMenuItem {
	key: TopMenuKey;
	label: string;
	path: string;
	defaultPath?: string;
}

/** 顶部菜单 */
export const TOP_MENUS: TopMenuItem[] = [
	{ key: "dashboard", label: "大屏", path: "/dashboard" },
	{ key: "statistics", label: "统计分析", path: "/statistics" },
	{
		key: "warning",
		label: "警告管理",
		path: "/warning",
		defaultPath: "/warning/list",
	},
	{
		key: "device",
		label: "设备管理",
		path: "/device",
		defaultPath: "/device/inspection-ledger",
	},
	{ key: "historicalData", label: "历史数据", path: "/historical-data" },
	{ key: "modelData", label: "物模型数据", path: "/model-data" },
	{ key: "reverseControl", label: "设备反控", path: "/reverse-control" },
	{
		key: "permission",
		label: "角色权限",
		path: "/permission",
		defaultPath: "/permission/role",
	},
];

export const DEFAULT_TOP_MENU_KEY: TopMenuKey = "warning";

export function getTopMenuByPath(pathname: string): TopMenuKey {
	const matched = TOP_MENUS.find((item) => pathname.startsWith(item.path));
	return matched?.key ?? DEFAULT_TOP_MENU_KEY;
}

export function getDefaultPathForTop(topKey: TopMenuKey): string {
	const menu = TOP_MENUS.find((item) => item.key === topKey);
	const fallback =
		TOP_MENUS.find((item) => item.key === DEFAULT_TOP_MENU_KEY)?.path ??
		"/warning/list";
	return menu?.defaultPath ?? menu?.path ?? fallback;
}

export function getPageLabel(pathname: string): string {
	return (
		TOP_MENUS.find((item) => item.key === getTopMenuByPath(pathname))
			?.label ?? pathname
	);
}

const ROUTE_TITLES: Record<string, string> = {
	"/login": "登录",
	"/403": "无权限",
	"/500": "服务器错误",
};

/** 根据路由生成浏览器标签页标题 */
export function getDocumentTitle(pathname: string): string {
	const routeTitle = ROUTE_TITLES[pathname];
	if (routeTitle) {
		return `${routeTitle} - ${import.meta.env.VITE_APP_TITLE}`;
	}

	const menuPage = TOP_MENUS.find((item) => pathname.startsWith(item.path));
	if (menuPage) {
		return `${menuPage.label} - ${import.meta.env.VITE_APP_TITLE}`;
	}

	return import.meta.env.VITE_APP_TITLE;
}
