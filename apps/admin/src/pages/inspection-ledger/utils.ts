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
	cycleUnit: "day",
	lastInspection: dayjs().format(DATE_FORMAT),
};

/** 筛选区「全部」选项。 */
export const ALL_BUILDING_OPTION = { label: "全部", value: "" } as const;

export const BUILDING_OPTIONS = [
	{ label: "X03", value: "X03" },
	{ label: "X05", value: "X05" },
	{ label: "X12", value: "X12" },
];

/**
 * 厂房 → 房间选项（后续可改为接口动态加载）。
 */
export const ROOMS_BY_BUILDING: Record<
	string,
	{ label: string; value: string }[]
> = {
	X03: [
		{ label: "101", value: "101" },
		{ label: "103", value: "103" },
		{ label: "104", value: "104" },
		{ label: "107", value: "107" },
		{ label: "109", value: "109" },
		{ label: "111", value: "111" },
		{ label: "113", value: "113" },
	],
	X05: [
		{ label: "201", value: "201" },
		{ label: "202", value: "202" },
		{ label: "203", value: "203" },
		{ label: "204", value: "204" },
		{ label: "205", value: "205" },
		{ label: "206", value: "206" },
	],
	X12: [
		{ label: "102", value: "102" },
		{ label: "105", value: "105" },
		{ label: "106", value: "106" },
		{ label: "108", value: "108" },
		{ label: "110", value: "110" },
		{ label: "112", value: "112" },
	],
};

export const TYPE_OPTIONS = [
	{ label: "泵", value: "pump" },
	{ label: "压缩机", value: "compressor" },
	{ label: "反应釜", value: "reactor" },
	{ label: "传感器", value: "sensor" },
	{ label: "阀门", value: "valve" },
	{ label: "风机", value: "fan" },
	{ label: "控制器", value: "controller" },
	{ label: "电机", value: "motor" },
	{ label: "换热器", value: "heat_exchanger" },
	{ label: "干燥机", value: "dryer" },
	{ label: "过滤器", value: "filter" },
	{ label: "冷却塔", value: "cooling_tower" },
];

export const CYCLE_UNIT_OPTIONS = [
	{ label: "天", value: "day" },
	{ label: "月", value: "month" },
];

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
 * @returns {Array<{ label: string; value: string }>} - 含「全部」的选项列表。
 */
export function normalizeBuildingOptions(
	data: unknown,
): { label: string; value: string }[] {
	const options: { label: string; value: string }[] = [ALL_BUILDING_OPTION];

	if (!Array.isArray(data)) return options;

	for (const item of data) {
		if (typeof item === "string" && item.trim()) {
			options.push({ label: item, value: item });
			continue;
		}
		if (item && typeof item === "object") {
			const record = item as Record<string, unknown>;
			const value = String(
				record.value ?? record.building ?? record.label ?? "",
			);
			if (!value.trim()) continue;
			options.push({
				label: String(record.label ?? record.building ?? value),
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
