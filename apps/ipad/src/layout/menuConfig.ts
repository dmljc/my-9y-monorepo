/**
 * 一级菜单标题（按路由前缀匹配）。
 */
const PAGE_MENU_TITLES: { prefix: string; title: string }[] = [
	{ prefix: "/device-control", title: "设备控制" },
	{ prefix: "/pipeline-config", title: "管道配置" },
];

/**
 * 按路径返回业务页一级菜单标题（顶栏展示）。
 *
 * @param {string} - 当前路由 pathname。
 * @returns {string} - 一级菜单标题；未匹配时返回空串。
 */
export const getPageMenuTitle = (pathname: string): string => {
	const matched = PAGE_MENU_TITLES.find((item) =>
		pathname.startsWith(item.prefix),
	);
	return matched?.title ?? "";
};

/**
 * 按路径返回文档标题（对外标题须脱敏）。
 *
 * @param {string} - 当前路由 pathname。
 * @returns {string} - document.title。
 */
export const getDocumentTitle = (pathname: string): string => {
	const appTitle = import.meta.env.VITE_APP_TITLE || "XXXX孪生平台";
	if (pathname.startsWith("/login")) {
		return `登录 - ${appTitle}`;
	}
	const menuTitle = getPageMenuTitle(pathname);
	if (menuTitle) {
		return `${menuTitle} - ${appTitle}`;
	}
	if (pathname.startsWith("/home")) {
		return appTitle;
	}
	return appTitle;
};

/** 登录成功后的默认落地页。 */
export const DEFAULT_HOME_PATH = "/home";
