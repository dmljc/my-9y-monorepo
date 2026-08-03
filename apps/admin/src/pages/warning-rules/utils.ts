import type { AlarmLevel, AlarmRule } from "./interface";

/**
 * 报警规则表格行。
 */
export interface WarningRule {
	id: string;
	name: string;
	buildingNames: string[];
	roomNames: string[];
	deviceNames: string[];
	instanceNames: string[];
	pointNames: string[];
	thresholdMin: number;
	thresholdMax: number;
	levelId: string;
	levelName: string;
	levelColor: string;
	enabled: boolean;
}

/**
 * 新增 / 编辑表单值。
 */
export interface RuleFormValues {
	name: string;
	buildingNames: string[];
	roomNames: string[];
	deviceNames: string[];
	instanceNames: string[];
	pointNames: string[];
	thresholdMin: number;
	thresholdMax: number;
	levelId: string;
	enabled: boolean;
}

/**
 * 报警等级下拉选项。
 */
export interface RuleLevelOption {
	value: string;
	label: string;
	color?: string;
}

/**
 * 报警规则列表分页结果。
 */
export interface RuleListResult {
	list: WarningRule[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/**
 * 规则名称最大长度。
 */
export const MAX_LENGTH_12 = 12;

/**
 * 报警阈值最小值。
 */
export const THRESHOLD_MIN = 0;

/**
 * 报警阈值最大值。
 */
export const THRESHOLD_MAX = 99999.99;

/**
 * 厂房选项。
 */
export const BUILDING_OPTIONS = ["X03", "X05", "X12", "12"].map((value) => ({
	label: value,
	value,
}));

/**
 * 房间选项。
 */
export const ROOM_OPTIONS = ["101", "A区-201", "B区-305", "C区-108"].map(
	(value) => ({ label: value, value }),
);

/**
 * 设备选项。
 */
export const DEVICE_OPTIONS = [
	"反应釜",
	"反应釜-A114",
	"料线控制器",
	"温控传感器-A101",
	"压力表-B203",
	"电机控制器-C305",
].map((value) => ({ label: value, value }));

/**
 * 实例选项。
 */
export const INSTANCE_OPTIONS = [
	"/114_FV201_KDFK",
	"/101_ROOM_TEMP",
	"/201_NH3",
	"/FEED_LINE_LOAD",
].map((value) => ({ label: value, value }));

/**
 * 点位选项。
 */
export const POINT_OPTIONS = [
	"/114_FV201_KDFK",
	"/101_ROOM_TEMP",
	"/201_NH3",
	"/FEED_LINE_LOAD",
	"/114_FV201_TEMP",
	"/ROOM_HUMIDITY",
].map((value) => ({ label: value, value }));

type LevelMap = Record<string, RuleLevelOption>;

/**
 * 解析分页响应中的列表与总数。
 */
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

/**
 * 将后端状态字段转为启用状态。
 */
function toEnabled(status?: string): boolean {
	return status !== "1" && status !== "disabled" && status !== "false";
}

/**
 * 将启用状态转为后端状态值。
 */
function toStatus(enabled?: boolean): string {
	return enabled === false ? "1" : "0";
}

/**
 * 将报警等级选项构造成查表对象。
 */
function buildLevelMap(options: RuleLevelOption[]): LevelMap {
	return Object.fromEntries(options.map((item) => [item.value, item]));
}

/**
 * 格式化阈值范围为展示文本。
 */
export function formatThresholdRange(min: number, max: number): string {
	return `${min}-${max}`;
}

/**
 * 将后端逗号分隔字段规范为字符串数组。
 */
export function normalizeMultiSelectValue(value?: string): string[] {
	if (!value?.trim()) return [];
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

/**
 * 将报警等级接口响应转为下拉选项。
 */
export function toLevelOptions(data: unknown): RuleLevelOption[] {
	const { rows } = parseRows<AlarmLevel>(data);
	return rows
		.filter((level) => level.id !== undefined)
		.map((level) => ({
			value: String(level.id),
			label: level.levelName ?? "",
			color: level.color,
		}));
}

/**
 * 将后端报警规则实体转为表格行。
 */
export function toWarningRule(
	rule: AlarmRule,
	levelMap: LevelMap = {},
): WarningRule {
	const levelOption =
		rule.levelId === undefined ? undefined : levelMap[String(rule.levelId)];
	const instanceNames = normalizeMultiSelectValue(
		rule.thingName ?? rule.thingId,
	);
	return {
		id: String(rule.id ?? ""),
		name: rule.ruleName ?? "",
		buildingNames: normalizeMultiSelectValue(rule.building),
		roomNames: normalizeMultiSelectValue(rule.room),
		deviceNames: normalizeMultiSelectValue(rule.deviceName),
		instanceNames,
		pointNames: normalizeMultiSelectValue(
			rule.propertyName ?? rule.propertyId,
		),
		thresholdMin: Number(rule.thresholdMin ?? 0),
		thresholdMax: Number(rule.thresholdMax ?? 0),
		levelId: String(rule.levelId ?? ""),
		levelName: rule.levelName ?? levelOption?.label ?? "",
		levelColor: rule.levelColor ?? levelOption?.color ?? "",
		enabled: toEnabled(rule.status),
	};
}

/**
 * 构建报警规则列表分页结果。
 */
export function buildRuleListResult(
	data: unknown,
	levelOptions: RuleLevelOption[],
	pageNum: number,
	pageSize: number,
): RuleListResult {
	const levelMap = buildLevelMap(levelOptions);
	const { rows, total } = parseRows<AlarmRule>(data);
	return {
		list: rows.map((rule) => toWarningRule(rule, levelMap)),
		total,
		pageNum,
		pageSize,
	};
}

/**
 * 将表单值转为后端报警规则实体。
 */
export function toAlarmRulePayload(
	values: Partial<RuleFormValues>,
	id?: string,
): AlarmRule {
	const building = values.buildingNames?.join(",");
	const room = values.roomNames?.join(",");
	const deviceName = values.deviceNames?.join(",");
	const thingName = values.instanceNames?.join(",");
	const propertyName = values.pointNames?.join(",");

	return {
		id: id ? Number(id) : undefined,
		ruleName: values.name?.trim(),
		monitorType: "room",
		building: building?.trim(),
		room: room?.trim(),
		deviceName: deviceName?.trim(),
		thingName: thingName?.trim(),
		thingId: thingName?.trim(),
		propertyName: propertyName?.trim(),
		propertyId: propertyName?.trim(),
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
