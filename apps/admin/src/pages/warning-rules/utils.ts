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
	propertyKeys: string[];
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
	propertyKeys: string[];
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
export const BUILDING_OPTIONS = ["X03", "X05", "X12"].map((value) => ({
	label: value,
	value,
}));

/**
 * 设备选项。
 */
export const DEVICE_OPTIONS = [
	"反应釜-A114",
	"料线控制器",
	"温控传感器-A101",
	"压力表-B203",
	"电机控制器-C305",
].map((value) => ({ label: value, value }));

/**
 * 房间选项。
 */
export const ROOM_OPTIONS = ["101", "A区-201", "B区-305", "C区-108"].map(
	(value) => ({ label: value, value }),
);

/**
 * 物模型属性选项。
 */
export const PROPERTY_OPTIONS = [
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
 *
 * @param {unknown} - 后端分页响应 data 字段。
 * @returns {{ rows: T[]; total: number }} - 标准化后的行数据与总数。
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
 *
 * @param {string | undefined} - 后端状态值。
 * @returns {boolean} - 是否启用。
 */
function toEnabled(status?: string): boolean {
	return status !== "1" && status !== "disabled" && status !== "false";
}

/**
 * 将启用状态转为后端状态值。
 *
 * @param {boolean | undefined} - 是否启用。
 * @returns {string} - 后端状态值。
 */
function toStatus(enabled?: boolean): string {
	return enabled === false ? "1" : "0";
}

/**
 * 将报警等级选项构造成查表对象。
 *
 * @param {RuleLevelOption[]} - 报警等级选项。
 * @returns {Record<string, RuleLevelOption>} - 以等级 ID 为 key 的选项映射。
 */
function buildLevelMap(options: RuleLevelOption[]): LevelMap {
	return Object.fromEntries(options.map((item) => [item.value, item]));
}

/**
 * 格式化阈值范围为展示文本。
 *
 * @param {number} - 阈值下限。
 * @param {number} - 阈值上限。
 * @returns {string} - 阈值范围展示文本。
 */
export function formatThresholdRange(min: number, max: number): string {
	return `${min}-${max}`;
}

/**
 * 将后端逗号分隔字段规范为字符串数组。
 *
 * @param {string | undefined} - 逗号分隔的后端字段值。
 * @returns {string[]} - 多选字段值。
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
 *
 * @param {unknown} - 报警等级列表接口 data 字段。
 * @returns {RuleLevelOption[]} - 报警等级下拉选项。
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
 *
 * @param {AlarmRule} - 后端报警规则实体。
 * @param {Record<string, RuleLevelOption>} - 报警等级映射。
 * @returns {WarningRule} - 报警规则表格行。
 */
export function toWarningRule(
	rule: AlarmRule,
	levelMap: LevelMap = {},
): WarningRule {
	const levelOption =
		rule.levelId === undefined ? undefined : levelMap[String(rule.levelId)];
	return {
		id: String(rule.id ?? ""),
		name: rule.ruleName ?? "",
		buildingNames: normalizeMultiSelectValue(rule.buildingName),
		roomNames: normalizeMultiSelectValue(
			rule.roomName ?? rule.deviceName ?? rule.thingId,
		),
		deviceNames: normalizeMultiSelectValue(rule.deviceName ?? rule.thingId),
		propertyKeys: normalizeMultiSelectValue(
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
 *
 * @param {unknown} - 报警规则列表接口 data 字段。
 * @param {unknown} - 报警等级列表接口 data 字段。
 * @param {number} - 当前页码。
 * @param {number} - 每页条数。
 * @returns {RuleListResult} - 页面表格使用的分页结果。
 */
export function buildRuleListResult(
	data: unknown,
	levelData: unknown,
	pageNum: number,
	pageSize: number,
): RuleListResult {
	const levelMap = buildLevelMap(toLevelOptions(levelData));
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
 *
 * @param {Partial<RuleFormValues>} - 报警规则表单值。
 * @param {string | undefined} - 编辑态规则 ID。
 * @returns {AlarmRule} - 后端报警规则实体。
 */
export function toAlarmRulePayload(
	values: Partial<RuleFormValues>,
	id?: string,
): AlarmRule {
	const buildingName = values.buildingNames?.join(",");
	const roomName = values.roomNames?.join(",");
	const deviceName = values.deviceNames?.join(",");
	const propertyName = values.propertyKeys?.join(",");

	return {
		id: id ? Number(id) : undefined,
		ruleName: values.name?.trim(),
		monitorType: "room",
		buildingName: buildingName?.trim(),
		roomName: roomName?.trim(),
		deviceName: deviceName?.trim(),
		thingId: deviceName?.trim(),
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
