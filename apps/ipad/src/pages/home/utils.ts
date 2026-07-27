/**
 * 首页标题中需高亮的固定文案（对齐设计稿）。
 */
export const TITLE_ACCENT = "孪生";

/**
 * 首页标题拆分结果。
 */
export interface TitleParts {
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
 * @returns {TitleParts} - 拆分后的三段文案。
 */
export const splitTitle = (title: string): TitleParts => {
	const index = title.indexOf(TITLE_ACCENT);
	if (index === -1) {
		return { prefix: title, accent: "", suffix: "" };
	}
	return {
		prefix: title.slice(0, index),
		accent: TITLE_ACCENT,
		suffix: title.slice(index + TITLE_ACCENT.length),
	};
};

/**
 * 首页导航卡片配置项。
 */
export interface NavItem {
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
export const NAV_ITEMS: NavItem[] = [
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
		path: "/pipeline-config",
	},
	{
		key: "add-device",
		label: "添加设备",
		path: "/add-device",
	},
];
