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
	children?: SideMenuItem[];
}

export interface SideMenuItem {
	key: string;
	label: string;
	path: string;
}

/** 后端路由元信息。 */
interface BackendRouteMeta {
	title?: string;
	icon?: string;
	link?: string | null;
}

/** getRouters 返回的后端路由项。 */
export interface BackendRoute {
	name?: string;
	path?: string;
	component?: string;
	hidden?: boolean;
	redirect?: string;
	meta?: BackendRouteMeta;
	children?: BackendRoute[];
}

interface RouteConfig {
	key: TopMenuKey;
	label: string;
	path: string;
	defaultPath?: string;
}

const TOP_ROUTE_CONFIGS: RouteConfig[] = [
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

const SIDE_ROUTE_KEYS: Record<string, string> = {
	"/warning/list": "list",
	"/warning/rules": "rules",
	"/warning/levels": "levels",
	"/device/inspection-ledger": "inspectionLedger",
	"/permission/role": "role",
	"/permission/user": "user",
	"/permission/organization": "organization",
	"/permission/operation-log": "operationLog",
};

const SIDE_ROUTE_ORDER: Record<string, number> = {
	role: 1,
	user: 2,
	organization: 3,
	operationLog: 4,
};

function sortSideMenus(menus: SideMenuItem[]): SideMenuItem[] {
	return [...menus].sort(
		(prev, next) =>
			(SIDE_ROUTE_ORDER[prev.key] ?? Number.MAX_SAFE_INTEGER) -
			(SIDE_ROUTE_ORDER[next.key] ?? Number.MAX_SAFE_INTEGER),
	);
}

interface RouteCandidate {
	label: string;
	path: string;
	children: RouteCandidate[];
}

function normalizePath(path: string): string {
	const value = path.trim();
	if (!value) return "";
	if (/^https?:\/\//.test(value)) return value;
	return `/${value.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

function joinRoutePath(parentPath: string, path?: string): string {
	if (!path?.trim()) return parentPath;
	if (/^https?:\/\//.test(path)) return path;
	if (path.startsWith("/")) return normalizePath(path);
	const normalizedParent = normalizePath(parentPath);
	if (!normalizedParent) return normalizePath(path);

	const parentSegments = normalizedParent.split("/").filter(Boolean);
	const childSegments = path.replace(/^\/+/, "").split("/").filter(Boolean);
	const parentTail = parentSegments[parentSegments.length - 1];

	// 子路径已含父级末段（如 permission + permission/operation-log）时去重
	if (parentTail && childSegments[0] === parentTail) {
		return normalizePath(
			`${normalizedParent}/${childSegments.slice(1).join("/")}`,
		);
	}

	return normalizePath(`${normalizedParent}/${path}`);
}

function getRouteTitle(route: BackendRoute): string {
	return (
		(route.meta?.title?.trim() || route.name?.trim() || route.path) ?? ""
	);
}

function collectRouteCandidates(
	routes: BackendRoute[],
	parentPath = "",
): RouteCandidate[] {
	const candidates: RouteCandidate[] = [];

	for (const route of routes) {
		const currentPath = joinRoutePath(parentPath, route.path);
		const children = collectRouteCandidates(
			route.children ?? [],
			currentPath,
		);

		if (route.hidden) {
			candidates.push(...children);
			continue;
		}

		const label = getRouteTitle(route);
		if (currentPath && label) {
			candidates.push({
				label,
				path: currentPath,
				children,
			});
			continue;
		}

		candidates.push(...children);
	}

	return candidates;
}

function flattenCandidates(candidates: RouteCandidate[]): RouteCandidate[] {
	return candidates.flatMap((candidate) => [
		candidate,
		...flattenCandidates(candidate.children),
	]);
}

function findCandidateByPath(
	candidates: RouteCandidate[],
	path: string,
): RouteCandidate | undefined {
	const normalizedPath = normalizePath(path);
	return flattenCandidates(candidates).find(
		(candidate) => candidate.path === normalizedPath,
	);
}

function collectSideMenus(
	topConfig: RouteConfig,
	topCandidate: RouteCandidate | undefined,
): SideMenuItem[] {
	if (!topCandidate) return [];

	const backendMenus = flattenCandidates(topCandidate.children)
		.filter((candidate) => candidate.path.startsWith(`${topConfig.path}/`))
		.map((candidate) => {
			const key = SIDE_ROUTE_KEYS[candidate.path];
			return key
				? {
						key,
						label: candidate.label,
						path: candidate.path,
					}
				: null;
		})
		.filter((item): item is SideMenuItem => item !== null);
	return sortSideMenus(backendMenus);
}

/**
 * 从接口响应中解析后端路由数组。
 *
 * @param {unknown} - getRouters 接口响应。
 * @returns {BackendRoute[]} - 后端路由数组。
 */
export function parseRouterResponse(data: unknown): BackendRoute[] {
	if (Array.isArray(data)) return data as BackendRoute[];
	if (!data || typeof data !== "object") return [];

	const record = data as Record<string, unknown>;
	if (Array.isArray(record.data)) return record.data as BackendRoute[];
	if (Array.isArray(record.routers)) return record.routers as BackendRoute[];
	return [];
}

/**
 * 将后端路由转换为前端可渲染菜单。
 *
 * @param {BackendRoute[]} - 后端路由数组。
 * @returns {TopMenuItem[]} - 顶部菜单与侧边菜单。
 */
export function buildAppMenus(routes: BackendRoute[]): TopMenuItem[] {
	const candidates = collectRouteCandidates(routes);
	const result: TopMenuItem[] = [];

	for (const config of TOP_ROUTE_CONFIGS) {
		const topCandidate = findCandidateByPath(candidates, config.path);
		const children = collectSideMenus(config, topCandidate);

		if (!topCandidate && children.length === 0) {
			continue;
		}

		result.push({
			key: config.key,
			label: topCandidate?.label ?? config.label,
			path: config.path,
			defaultPath: config.defaultPath,
			children,
		});
	}

	return result;
}

export function getTopMenuByPath(
	pathname: string,
	menus: TopMenuItem[] = [],
): TopMenuKey {
	const sourceMenus = menus.length > 0 ? menus : TOP_ROUTE_CONFIGS;
	const matched = sourceMenus.find((item) => pathname.startsWith(item.path));
	return matched?.key ?? DEFAULT_TOP_MENU_KEY;
}

export function getDefaultPathForTop(
	topKey: TopMenuKey,
	menus: TopMenuItem[] = [],
): string {
	const sourceMenus = menus.length > 0 ? menus : TOP_ROUTE_CONFIGS;
	const menu = sourceMenus.find((item) => item.key === topKey);
	const fallback =
		sourceMenus.find((item) => item.key === DEFAULT_TOP_MENU_KEY)?.path ??
		"/warning/list";
	return menu?.defaultPath ?? menu?.path ?? fallback;
}

export function getPageLabel(pathname: string): string {
	return (
		TOP_ROUTE_CONFIGS.find(
			(item) => item.key === getTopMenuByPath(pathname),
		)?.label ?? pathname
	);
}

export function getSideMenus(
	topKey: TopMenuKey,
	menus: TopMenuItem[] = [],
): SideMenuItem[] {
	return sortSideMenus(
		menus.find((item) => item.key === topKey)?.children ?? [],
	);
}

export function getActiveSideMenu(
	topKey: TopMenuKey,
	pathname: string,
	menus: TopMenuItem[] = [],
): SideMenuItem | null {
	const sideMenus = getSideMenus(topKey, menus);
	return sideMenus.find((item) => pathname.startsWith(item.path)) ?? null;
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

	const menuPage = TOP_ROUTE_CONFIGS.find((item) =>
		pathname.startsWith(item.path),
	);
	if (menuPage) {
		return `${menuPage.label} - ${import.meta.env.VITE_APP_TITLE}`;
	}

	return import.meta.env.VITE_APP_TITLE;
}
