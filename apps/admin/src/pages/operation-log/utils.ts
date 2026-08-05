import dayjs, { type Dayjs } from "dayjs";

/**
 * 操作日志快捷时间范围。
 */
export type QuickRange = "24h" | "7d" | "15d" | "30d";

/** 默认快捷时间范围。 */
export const DEFAULT_QUICK_RANGE: QuickRange = "24h";

/** 列表查询时间格式。 */
export const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

/**
 * 快捷时间范围选项。
 */
export const QUICK_RANGE_OPTIONS = [
	{ label: "近24小时", value: "24h" },
	{ label: "近7天", value: "7d" },
	{ label: "近15天", value: "15d" },
	{ label: "近30天", value: "30d" },
];

/**
 * 根据快捷范围生成日期区间。
 *
 * @param {QuickRange} - 快捷范围。
 * @returns {[Dayjs, Dayjs]} - 起止日期时间。
 */
export function getQuickRangeDates(range: QuickRange): [Dayjs, Dayjs] {
	const end = dayjs();
	const amountMap: Record<QuickRange, number> = {
		"24h": 1,
		"7d": 7,
		"15d": 15,
		"30d": 30,
	};
	return [end.subtract(amountMap[range], "day"), end];
}

/**
 * 生成导出文件名（前缀为当前年月日时分秒）。
 *
 * @returns {string} - 导出文件名。
 */
export function buildExportFileName(): string {
	return `${dayjs().format(DATE_TIME_FORMAT)}_操作日志.xlsx`;
}
