/** 报警等级 */
export interface WarningLevel {
	id: string;
	name: string;
	color: string;
	sortOrder?: number;
}

/** 新增 / 编辑表单值 */
export interface LevelFormValues {
	name: string;
	color: string;
}

/** 默认色：蓝（Ant Design blue.primary）。 */
export const DEFAULT_COLOR = "#1677FF";

/**
 * 光谱七色预置（Ant Design 主色：红、橙、黄、绿、青、蓝、紫）。
 * name：展示于色卡下方。
 */
export const COLOR_PRESET_ITEMS = [
	{ name: "红", color: "#F5222D" },
	{ name: "橙", color: "#FA8C16" },
	{ name: "黄", color: "#FADB14" },
	{ name: "绿", color: "#52C41A" },
	{ name: "青", color: "#13C2C2" },
	{ name: "蓝", color: "#1677FF" },
	{ name: "紫", color: "#722ED1" },
] as const;
