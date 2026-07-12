/**
 * 首页标题中需高亮的固定文案（对齐设计稿）。
 */
export const HOME_TITLE_ACCENT = "孪生";

/**
 * 首页标题拆分结果。
 */
export interface HomeTitleParts {
	/** 高亮段之前的文案。 */
	prefix: string;
	/** 蓝色高亮段。 */
	accent: string;
	/** 高亮段之后的文案。 */
	suffix: string;
}

/**
 * 将首页标题拆成前缀 / 高亮「孪生」/ 后缀，便于按设计稿着色。
 *
 * @param {string} - 脱敏后的完整标题。
 * @returns {HomeTitleParts} - 拆分后的三段文案。
 */
export const splitHomeTitle = (title: string): HomeTitleParts => {
	const index = title.indexOf(HOME_TITLE_ACCENT);
	if (index === -1) {
		return { prefix: title, accent: "", suffix: "" };
	}
	return {
		prefix: title.slice(0, index),
		accent: HOME_TITLE_ACCENT,
		suffix: title.slice(index + HOME_TITLE_ACCENT.length),
	};
};

/**
 * 首页导航卡片配置项。
 */
export interface HomeNavItem {
	/** 导航唯一键。 */
	key: "device-control" | "sample" | "pipeline" | "add-device";
	/** 展示文案。 */
	label: string;
	/** 已实现功能的路由；未实现时留空。 */
	path?: string;
}

/**
 * 首页四宫格导航（对齐蓝湖稿）。
 */
export const HOME_NAV_ITEMS: HomeNavItem[] = [
	{
		key: "device-control",
		label: "设备控制",
		path: "/device-control",
	},
	{
		key: "sample",
		label: "取样配置",
		path: "/sample-config",
	},
	{
		key: "pipeline",
		label: "管道配置",
	},
	{
		key: "add-device",
		label: "添加设备",
	},
];
