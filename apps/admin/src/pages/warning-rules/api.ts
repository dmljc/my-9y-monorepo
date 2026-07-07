import { request } from "@/utils";
import type {
	MonitorType,
	RuleFormValues,
	RuleLevelOption,
	WarningRule,
} from "./utils";

/** 列表查询参数 */
export interface RuleListParams {
	pageNum: number;
	pageSize: number;
	name?: string;
}

/** 列表返回结果 */
export interface RuleListResult {
	list: WarningRule[];
	total: number;
	pageNum: number;
	pageSize: number;
}

interface IiotAlarmRule {
	id?: number;
	ruleName?: string;
	monitorType?: string;
	deviceName?: string;
	thingId?: string;
	propertyName?: string;
	propertyId?: string;
	thresholdMin?: string;
	thresholdMax?: string;
	levelId?: number;
	levelName?: string;
	levelColor?: string;
	status?: string;
}

interface IiotAlarmLevel {
	id?: number;
	levelName?: string;
	color?: string;
}

type LevelMap = Record<string, RuleLevelOption>;

function parseRows<T>(data: unknown): { rows: T[]; total: number } {
	if (!data || typeof data !== "object") return { rows: [], total: 0 };
	const record = data as Record<string, unknown>;
	const rows = Array.isArray(record.rows)
		? (record.rows as T[])
		: Array.isArray(record.list)
			? (record.list as T[])
			: [];
	return {
		rows,
		total: typeof record.total === "number" ? record.total : rows.length,
	};
}

function toMonitorType(value?: string): MonitorType {
	return value === "room" ? "room" : "device";
}

function toEnabled(status?: string): boolean {
	return status !== "1" && status !== "disabled" && status !== "false";
}

function toWarningRule(
	rule: IiotAlarmRule,
	levelMap: LevelMap = {},
): WarningRule {
	const levelOption =
		rule.levelId === undefined ? undefined : levelMap[String(rule.levelId)];
	return {
		id: String(rule.id ?? ""),
		name: rule.ruleName ?? "",
		monitorType: toMonitorType(rule.monitorType),
		targetName: rule.deviceName ?? rule.thingId ?? "",
		propertyKey: rule.propertyName ?? rule.propertyId ?? "",
		thresholdMin: Number(rule.thresholdMin ?? 0),
		thresholdMax: Number(rule.thresholdMax ?? 0),
		levelId: String(rule.levelId ?? ""),
		levelName: rule.levelName ?? levelOption?.label ?? "",
		levelColor: rule.levelColor ?? levelOption?.color ?? "",
		enabled: toEnabled(rule.status),
	};
}

function toStatus(enabled?: boolean): string {
	return enabled === false ? "1" : "0";
}

function toAlarmRulePayload(
	values: Partial<RuleFormValues>,
	id?: string,
): IiotAlarmRule {
	return {
		id: id ? Number(id) : undefined,
		ruleName: values.name?.trim(),
		monitorType: values.monitorType,
		deviceName: values.targetName?.trim(),
		thingId: values.targetName?.trim(),
		propertyName: values.propertyKey?.trim(),
		propertyId: values.propertyKey?.trim(),
		thresholdMin:
			values.thresholdMin === undefined
				? undefined
				: String(values.thresholdMin),
		thresholdMax:
			values.thresholdMax === undefined
				? undefined
				: String(values.thresholdMax),
		levelId: values.levelId ? Number(values.levelId) : undefined,
		status: toStatus(values.enabled),
	};
}

async function fetchLevelOptions(): Promise<RuleLevelOption[]> {
	const data = await request.get("/iiot/alarm/level/list", {
		params: { pageNum: 1, pageSize: 100 },
	});
	const { rows } = parseRows<IiotAlarmLevel>(data);
	return rows
		.filter((level) => level.id !== undefined)
		.map((level) => ({
			value: String(level.id),
			label: level.levelName ?? "",
			color: level.color,
		}));
}

async function fetchLevelMap(): Promise<LevelMap> {
	const options = await fetchLevelOptions();
	return Object.fromEntries(options.map((item) => [item.value, item]));
}

/** 获取报警规则列表（分页） */
export async function list(params: RuleListParams): Promise<RuleListResult> {
	const [data, levelMap] = await Promise.all([
		request.get("/iiot/alarm/rule/list", {
			params: {
				pageNum: params.pageNum,
				pageSize: params.pageSize,
				ruleName: params.name,
			},
		}),
		fetchLevelMap(),
	]);
	const { rows, total } = parseRows<IiotAlarmRule>(data);
	const { pageNum, pageSize } = params;
	return {
		list: rows.map((rule) => toWarningRule(rule, levelMap)),
		total,
		pageNum,
		pageSize,
	};
}

/** 创建报警规则 */
export async function create(values: RuleFormValues): Promise<void> {
	await request.post("/iiot/alarm/rule", toAlarmRulePayload(values));
}

/** 更新报警规则 */
export async function update(
	id: string,
	values: Partial<RuleFormValues & Pick<WarningRule, "enabled">>,
): Promise<void> {
	await request.put("/iiot/alarm/rule", toAlarmRulePayload(values, id));
}

/** 删除报警规则 */
export async function remove(id: string): Promise<void> {
	await request.delete(`/iiot/alarm/rule/${id}`);
}

/** 获取报警等级选项 */
export async function getLevelOptions(): Promise<RuleLevelOption[]> {
	return fetchLevelOptions();
}
