/** 顶部一级菜单 key */
export type TopMenuKey =
	| "dashboard"
	| "statistics"
	| "warning"
	| "task"
	| "device"
	| "controlPanel"
	| "reverseControl"
	| "system"
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
	// { key: "task", label: "任务管理", path: "/task" },
	{ key: "device", label: "设备数据", path: "/device" },
	{ key: "controlPanel", label: "控制面板", path: "/control-panel" },
	{ key: "reverseControl", label: "设备反控", path: "/reverse-control" },
	{
		key: "system",
		label: "系统集成",
		path: "/system",
	},
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
	return (
		menu?.defaultPath ??
		menu?.path ??
		TOP_MENUS.find((item) => item.key === DEFAULT_TOP_MENU_KEY)?.path
	);
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
