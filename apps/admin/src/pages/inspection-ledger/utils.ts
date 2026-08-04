import dayjs from "dayjs";
import type { DeviceFormValues, DeviceLedgerStats } from "./interface";
import type { StatCard, StatCardAssets } from "./types";

export type { StatCard, StatCardAssets } from "./types";

/** 设备编码最大长度。 */
export const MAX_LENGTH_20 = 20;

/** 设备名称、生产厂家最大长度。 */
export const MAX_LENGTH_12 = 12;

/** 日期存储/展示格式。 */
export const DATE_FORMAT = "YYYY-MM-DD";

/** 新增表单默认值。 */
export const DEFAULT_FORM_VALUES: Pick<
	DeviceFormValues,
	"cycleValue" | "cycleUnit" | "lastInspection"
> = {
	cycleValue: 7,
	cycleUnit: "天",
	lastInspection: dayjs().format(DATE_FORMAT),
};

/** 筛选区「全部」选项。 */
export const ALL_BUILDING_OPTION = { label: "全部", value: "" } as const;

/** 设备类型选项（value 与接口示例一致，传中文）。 */
export const TYPE_OPTIONS = [
	{ label: "泵", value: "泵" },
	{ label: "压缩机", value: "压缩机" },
	{ label: "反应釜", value: "反应釜" },
	{ label: "传感器", value: "传感器" },
	{ label: "阀门", value: "阀门" },
	{ label: "风机", value: "风机" },
	{ label: "控制器", value: "控制器" },
	{ label: "电机", value: "电机" },
	{ label: "换热器", value: "换热器" },
	{ label: "干燥机", value: "干燥机" },
	{ label: "过滤器", value: "过滤器" },
	{ label: "冷却塔", value: "冷却塔" },
];

/** 周期单位选项：天/周/月。 */
export const CYCLE_UNIT_OPTIONS = [
	{ label: "天", value: "天" },
	{ label: "周", value: "周" },
	{ label: "月", value: "月" },
];

/** 历史英文周期单位到中文值的映射。 */
const CYCLE_UNIT_ALIASES: Record<string, string> = {
	day: "天",
	week: "周",
	month: "月",
	year: "年",
};

/** 历史英文设备类型到中文值的映射。 */
const DEVICE_TYPE_ALIASES: Record<string, string> = {
	pump: "泵",
	compressor: "压缩机",
	reactor: "反应釜",
	sensor: "传感器",
	valve: "阀门",
	fan: "风机",
	controller: "控制器",
	motor: "电机",
	heat_exchanger: "换热器",
	dryer: "干燥机",
	filter: "过滤器",
	cooling_tower: "冷却塔",
};

/**
 * 将周期单位规范为中文值。
 *
 * @param {string | undefined} - 表单或列表中的周期单位。
 * @returns {string} - 天/周/月；无法识别时原样返回。
 */
export function normalizeCycleUnit(unit?: string): string {
	if (!unit) return "";
	return CYCLE_UNIT_ALIASES[unit] ?? unit;
}

/**
 * 将设备类型规范为接口中文值。
 *
 * @param {string | undefined} - 表单或列表中的设备类型。
 * @returns {string} - 中文类型名；无法识别时原样返回。
 */
export function normalizeDeviceType(type?: string): string {
	if (!type) return "";
	return DEVICE_TYPE_ALIASES[type] ?? type;
}

/**
 * 计算下次点检日期展示值。
 *
 * @param {string | undefined} - 上次点检日期。
 * @param {number | undefined} - 周期数值。
 * @param {string | undefined} - 周期单位（天/周/月或历史值）。
 * @returns {string} - YYYY-MM-DD；条件不足时返回空串。
 */
export function calcNextInspectionDate(
	lastInspection?: string,
	cycleValue?: number,
	cycleUnit?: string,
): string {
	if (!lastInspection || !cycleValue || !cycleUnit) return "";
	const unit = normalizeCycleUnit(cycleUnit);
	const amount = Number(cycleValue);
	if (!unit || !Number.isFinite(amount) || amount < 1) return "";

	const base = dayjs(lastInspection);
	if (!base.isValid()) return "";

	if (unit === "周") return base.add(amount, "week").format(DATE_FORMAT);
	if (unit === "月") return base.add(amount, "month").format(DATE_FORMAT);
	if (unit === "年") return base.add(amount, "year").format(DATE_FORMAT);
	return base.add(amount, "day").format(DATE_FORMAT);
}

/**
 * 将统计接口响应规范为页面使用的结构。
 *
 * @param {Record<string, unknown>} - 统计接口 data 字段。
 * @returns {DeviceLedgerStats} - 顶部卡片统计数据。
 */
export function normalizeStats(
	data: Record<string, unknown>,
): DeviceLedgerStats {
	return {
		total: Number(data.total ?? data.deviceTotal ?? 0),
		expiringSoon: Number(
			data.expiringSoon ?? data.expiring ?? data.soonCount ?? 0,
		),
		overdue: Number(data.overdue ?? data.overdueCount ?? 0),
	};
}

/**
 * 将厂房列表接口响应转为 Select 选项。
 *
 * @param {unknown} - 厂房接口 data 字段。
 * @param {boolean} - 是否包含「全部」选项。
 * @param {boolean} - 为 true 时 value 取厂房 ID（表单联动房间）；否则取厂房名称（筛选）。
 * @returns {Array<{ label: string; value: string }>} - 厂房选项列表。
 */
export function normalizeBuildingOptions(
	data: unknown,
	includeAll = true,
	valueAsId = false,
): { label: string; value: string }[] {
	const options: { label: string; value: string }[] = includeAll
		? [ALL_BUILDING_OPTION]
		: [];

	if (!Array.isArray(data)) return options;

	for (const item of data) {
		if (typeof item === "string" && item.trim()) {
			options.push({ label: item, value: item });
			continue;
		}
		if (item && typeof item === "object") {
			const record = item as Record<string, unknown>;
			const name = String(
				record.label ??
					record.building ??
					record.buildingName ??
					record.name ??
					"",
			).trim();
			const id = String(
				record.value ?? record.buildingId ?? record.id ?? "",
			).trim();
			const value = valueAsId ? id || name : name || id;
			if (!value) continue;
			options.push({
				label: name || value,
				value,
			});
		}
	}

	return options;
}

/**
 * 将房间列表接口响应转为 Select 选项（value / label 均为房间名称）。
 *
 * @param {unknown} - 房间接口 data 字段。
 * @returns {Array<{ label: string; value: string }>} - 房间选项列表。
 */
export function normalizeRoomOptions(
	data: unknown,
): { label: string; value: string }[] {
	const options: { label: string; value: string }[] = [];

	if (!Array.isArray(data)) return options;

	for (const item of data) {
		if (typeof item === "string" && item.trim()) {
			options.push({ label: item, value: item });
			continue;
		}
		if (item && typeof item === "object") {
			const record = item as Record<string, unknown>;
			const name = String(
				record.label ??
					record.room ??
					record.roomName ??
					record.name ??
					record.roomNo ??
					"",
			).trim();
			const fallbackId = String(
				record.value ?? record.roomId ?? record.id ?? "",
			).trim();
			const value = name || fallbackId;
			if (!value) continue;
			options.push({
				label: name || value,
				value,
			});
		}
	}

	return options;
}

/**
 * 根据统计数据构建顶部卡片。
 *
 * @param {DeviceLedgerStats} - 设备统计数据。
 * @param {StatCardAssets} - 卡片插图与背景资源。
 * @returns {StatCard[]} - 顶部统计卡片数据。
 */
export function buildStatCards(
	stats: DeviceLedgerStats,
	assets: StatCardAssets,
): StatCard[] {
	return [
		{
			key: "total",
			title: "设备总数",
			value: stats.total,
			image: assets.totalImg,
			background: assets.blueCircleBg,
			tone: "blue",
		},
		{
			key: "expiringSoon",
			title: "即将到期",
			value: stats.expiringSoon,
			image: assets.expiringImg,
			background: assets.purpleCircleBg,
			tone: "purple",
			valueColor: "#fa8c16",
		},
		{
			key: "overdue",
			title: "逾期未检",
			value: stats.overdue,
			image: assets.overdueImg,
			background: assets.orangeCircleBg,
			tone: "orange",
			valueColor: "#f5222d",
		},
	];
}

/**
 * 将表单/接口中的日期值规范为 YYYY-MM-DD 字符串。
 *
 * @param {string | dayjs.Dayjs | undefined} - 日期输入值。
 * @returns {string} - 规范化后的日期字符串。
 */
export function normalizeDateValue(
	value: string | dayjs.Dayjs | undefined,
): string {
	if (!value) return "";
	return typeof value === "string" ? value : value.format(DATE_FORMAT);
}

/**
 * 将表单日期转为接口 date-time 字符串。
 *
 * @param {string} - YYYY-MM-DD 格式日期。
 * @returns {string} - 接口可接受的日期时间字符串。
 */
export function toApiDateTime(value: string): string {
	const normalized = normalizeDateValue(value);
	if (!normalized) return "";
	const dateOnly = normalized.slice(0, 10);
	return `${dateOnly} 00:00:00`;
}
