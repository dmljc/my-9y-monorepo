import { request } from "@/utils";
import type { LevelFormValues, WarningLevel } from "./utils";

/** 列表查询参数 */
export interface LevelListParams {
	pageNum: number;
	pageSize: number;
}

/** 列表返回结果 */
export interface LevelListResult {
	list: WarningLevel[];
	total: number;
	pageNum: number;
	pageSize: number;
}

interface IiotAlarmLevel {
	id?: number;
	levelName?: string;
	color?: string;
	sortOrder?: number;
}

function parseRows(data: unknown): { rows: IiotAlarmLevel[]; total: number } {
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

function toWarningLevel(level: IiotAlarmLevel): WarningLevel {
	return {
		id: String(level.id ?? ""),
		name: level.levelName ?? "",
		color: level.color ?? "",
		sortOrder: level.sortOrder,
	};
}

function toAlarmLevelPayload(
	values: LevelFormValues,
	id?: string,
): IiotAlarmLevel {
	return {
		id: id ? Number(id) : undefined,
		levelName: values.name.trim(),
		color: values.color,
	};
}

/** 获取报警等级列表（分页） */
export async function list(params: LevelListParams): Promise<LevelListResult> {
	const data = await request.get("/iiot/alarm/level/list", {
		params,
	});
	const { rows, total } = parseRows(data);
	const { pageNum, pageSize } = params;
	return {
		list: rows.map(toWarningLevel),
		total,
		pageNum,
		pageSize,
	};
}

/** 创建报警等级 */
export async function create(values: LevelFormValues): Promise<void> {
	await request.post("/iiot/alarm/level", toAlarmLevelPayload(values));
}

/** 更新报警等级 */
export async function update(
	id: string,
	values: LevelFormValues,
): Promise<void> {
	await request.put("/iiot/alarm/level", toAlarmLevelPayload(values, id));
}

/** 删除报警等级 */
export async function remove(id: string): Promise<void> {
	await request.delete(`/iiot/alarm/level/${id}`);
}
