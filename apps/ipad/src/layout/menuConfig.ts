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
	if (pathname.startsWith("/device-control")) {
		return `设备控制 - ${appTitle}`;
	}
	if (pathname.startsWith("/sample-config")) {
		return `取样配置 - ${appTitle}`;
	}
	if (pathname.startsWith("/add-device")) {
		return `添加设备 - ${appTitle}`;
	}
	if (pathname.startsWith("/home")) {
		return appTitle;
	}
	return appTitle;
};

/** 登录成功后的默认落地页。 */
export const DEFAULT_HOME_PATH = "/home";
