import type { IiotAlarmLevel } from "./interface";

/**
 * 报警等级表格行。
 */
export interface WarningLevel {
	id: string;
	name: string;
	color: string;
	sortOrder?: number;
}

/**
 * 新增 / 编辑表单值。
 */
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

/**
 * 解析分页响应中的列表与总数。
 *
 * @param {unknown} - 列表接口解包后的 data。
 * @returns {{ rows: IiotAlarmLevel[]; total: number }} - 行数据与总数。
 */
export function parseLevelRows(data: unknown): {
	rows: IiotAlarmLevel[];
	total: number;
} {
	if (!data || typeof data !== "object") return { rows: [], total: 0 };
	const record = data as Record<string, unknown>;
	const rows = Array.isArray(record.rows)
		? (record.rows as IiotAlarmLevel[])
		: Array.isArray(record.list)
			? (record.list as IiotAlarmLevel[])
			: [];
	return {
		rows,
		total: typeof record.total === "number" ? record.total : rows.length,
	};
}

/**
 * 将后端报警等级转为表格行。
 *
 * @param {IiotAlarmLevel} - 后端实体。
 * @returns {WarningLevel} - 表格展示记录。
 */
export function toWarningLevel(level: IiotAlarmLevel): WarningLevel {
	return {
		id: String(level.id ?? ""),
		name: level.levelName ?? "",
		color: level.color ?? "",
		sortOrder: level.sortOrder,
	};
}

/**
 * 将表单值转为后端报警等级实体。
 *
 * @param {LevelFormValues} - 表单值。
 * @param {string | undefined} - 编辑时的等级 ID。
 * @returns {IiotAlarmLevel} - 提交体。
 */
export function toAlarmLevelPayload(
	values: LevelFormValues,
	id?: string,
): IiotAlarmLevel {
	return {
		id: id ? Number(id) : undefined,
		levelName: values.name.trim(),
		color: values.color.trim().toUpperCase(),
	};
}
