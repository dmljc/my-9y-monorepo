import type { AlarmLevel, AlarmRule } from "./interface";

/**
 * 下拉选项。
 */
export interface SelectOption {
	label: string;
	value: string;
}

/**
 * 报警规则表格行。
 */
export interface WarningRule {
	id: string;
	name: string;
	buildingId: string;
	building: string;
	roomId: string;
	room: string;
	deviceName: string;
	instanceName: string;
	pointName: string;
	propertyName?: string;
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
	buildingId: string;
	building?: string;
	roomId: string;
	room?: string;
	deviceName: string;
	instanceName: string;
	/** 点位 ID（对应 propertyId） */
	pointName: string;
	/** 点位名称（对应 propertyName） */
	propertyName?: string;
	thresholdMin: number;
	thresholdMax: number;
	levelId: string;
	levelName?: string;
	levelColor?: string;
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
export const THRESHOLD_MIN = -99999.99;

/**
 * 报警阈值最大值。
 */
export const THRESHOLD_MAX = 99999.99;

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
 * 将列表类接口 data 规范为数组。
 */
function toArray(data: unknown): unknown[] {
	if (Array.isArray(data)) return data;
	if (!data || typeof data !== "object") return [];
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.rows)) return record.rows;
	if (Array.isArray(record.list)) return record.list;
	if (Array.isArray(record.things)) return record.things;
	return [];
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
 * 判断色值是否偏亮（浅黄等需深色文字）。
 */
export function isLightHexColor(color?: string): boolean {
	if (!color) return false;
	const raw = color.trim().replace(/^#/, "");
	const hex =
		raw.length === 3
			? raw
					.split("")
					.map((char) => `${char}${char}`)
					.join("")
			: raw;
	if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7;
}

/**
 * 合并当前选中项与接口选项，避免编辑回显时 label 缺失。
 */
export function mergeOption(
	options: SelectOption[],
	value?: string,
	label?: string,
): SelectOption[] {
	if (!value) return options;
	if (options.some((item) => item.value === value)) return options;
	return [{ label: label || value, value }, ...options];
}

/**
 * 将厂房列表接口响应转为 Select 选项（value 为厂房 ID）。
 */
export function normalizeBuildingOptions(data: unknown): SelectOption[] {
	const options: SelectOption[] = [];
	if (!Array.isArray(data)) return options;

	for (const item of data) {
		if (typeof item === "string" && item.trim()) {
			options.push({ label: item, value: item });
			continue;
		}
		if (item && typeof item === "object") {
			const record = item as Record<string, unknown>;
			const value = String(
				record.value ??
					record.buildingId ??
					record.id ??
					record.building ??
					record.buildingName ??
					record.name ??
					record.label ??
					"",
			).trim();
			if (!value) continue;
			options.push({
				label: String(
					record.label ??
						record.building ??
						record.buildingName ??
						record.name ??
						value,
				),
				value,
			});
		}
	}

	return options;
}

/**
 * 将房间列表接口响应转为 Select 选项（value 为房间 ID）。
 */
export function normalizeRoomOptions(data: unknown): SelectOption[] {
	const options: SelectOption[] = [];
	if (!Array.isArray(data)) return options;

	for (const item of data) {
		if (typeof item === "string" && item.trim()) {
			options.push({ label: item, value: item });
			continue;
		}
		if (item && typeof item === "object") {
			const record = item as Record<string, unknown>;
			const value = String(
				record.value ??
					record.roomId ??
					record.id ??
					record.room ??
					record.roomName ??
					record.name ??
					record.label ??
					"",
			).trim();
			if (!value) continue;
			options.push({
				label: String(
					record.label ??
						record.room ??
						record.roomName ??
						record.name ??
						record.roomNo ??
						value,
				),
				value,
			});
		}
	}

	return options;
}

/**
 * 将设备台账列表转为设备名称选项。
 *
 * @param {unknown} - `/iiot/tablet/ledger/list` data。
 * @param {string | undefined} - 可选按房间名称过滤。
 */
export function normalizeDeviceOptions(
	data: unknown,
	roomName?: string,
): SelectOption[] {
	const options: SelectOption[] = [];
	const seen = new Set<string>();
	const roomFilter = roomName?.trim();

	for (const item of toArray(data)) {
		if (!item || typeof item !== "object") continue;
		const record = item as Record<string, unknown>;
		const name = String(record.deviceName ?? "").trim();
		if (!name || seen.has(name)) continue;
		if (roomFilter) {
			const room = String(record.room ?? "").trim();
			if (room && room !== roomFilter) continue;
		}
		seen.add(name);
		options.push({ label: name, value: name });
	}

	return options;
}

/**
 * 规范化 things 接口返回。
 */
export function normalizeThingsList(data: unknown): unknown[] {
	if (Array.isArray(data)) return data;
	if (!data || typeof data !== "object") return [];
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.things)) return record.things;
	if (record.data && typeof record.data === "object") {
		const nested = record.data as Record<string, unknown>;
		if (Array.isArray(nested.things)) return nested.things;
		if (Array.isArray(record.data)) return record.data;
	}
	return toArray(data);
}

/**
 * 物实例 → 实例名称选项（label=thing_name，value=thing_id）。
 */
export function toThingOptions(data: unknown): SelectOption[] {
	return normalizeThingsList(data).flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const record = item as Record<string, unknown>;
		const value = String(record.thing_id ?? record.thingId ?? "").trim();
		if (!value) return [];
		const name = String(record.thing_name ?? record.thingName ?? "").trim();
		return [{ label: name || value, value }];
	});
}

/**
 * 可控属性 → 点位选项（label=property_name，value=property_id）。
 */
export function toPropertyOptions(data: unknown): SelectOption[] {
	return toArray(data).flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const record = item as Record<string, unknown>;
		const value = String(
			record.property_id ?? record.propertyId ?? "",
		).trim();
		if (!value) return [];
		const name = String(
			record.property_name ?? record.propertyName ?? "",
		).trim();
		return [{ label: name || value, value }];
	});
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
	return {
		id: String(rule.id ?? ""),
		name: rule.ruleName ?? "",
		buildingId:
			rule.buildingId !== undefined ? String(rule.buildingId) : "",
		building: rule.building ?? "",
		roomId: rule.roomId !== undefined ? String(rule.roomId) : "",
		room: rule.room ?? "",
		deviceName: rule.deviceName ?? "",
		instanceName: (rule.thingId ?? "").trim(),
		pointName: (rule.propertyId ?? rule.propertyName ?? "").trim(),
		propertyName: rule.propertyName ?? rule.propertyId ?? "",
		thresholdMin: Number(rule.thresholdMin ?? 0),
		thresholdMax: Number(rule.thresholdMax ?? 0),
		levelId: String(rule.levelId ?? ""),
		levelName: levelOption?.label ?? rule.levelName ?? "",
		levelColor: levelOption?.color ?? rule.levelColor ?? "",
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
	const thingId = values.instanceName?.trim();
	const propertyId = values.pointName?.trim();
	const propertyName = values.propertyName?.trim() || propertyId;

	return {
		id: id ? Number(id) : undefined,
		ruleName: values.name?.trim(),
		buildingId: values.buildingId ? Number(values.buildingId) : undefined,
		building: values.building?.trim(),
		roomId: values.roomId ? Number(values.roomId) : undefined,
		room: values.room?.trim(),
		deviceName: values.deviceName?.trim(),
		thingId,
		propertyId,
		propertyName,
		thresholdMin:
			values.thresholdMin === undefined
				? undefined
				: String(values.thresholdMin),
		thresholdMax:
			values.thresholdMax === undefined
				? undefined
				: String(values.thresholdMax),
		levelId: values.levelId ? Number(values.levelId) : undefined,
		levelName: values.levelName?.trim(),
		levelColor: values.levelColor?.trim(),
		status: toStatus(values.enabled),
	};
}
