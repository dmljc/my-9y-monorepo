import dayjs, { type Dayjs } from "dayjs";
import type { SysOperLog } from "./interface";

/**
 * 操作日志快捷时间范围。
 */
export type QuickRange = "24h" | "7d" | "30d";

/**
 * 快捷时间范围选项。
 */
export const QUICK_RANGE_OPTIONS = [
	{ label: "近24小时", value: "24h" },
	{ label: "近7天", value: "7d" },
	{ label: "近30天", value: "30d" },
];

/**
 * 业务类型字典（对应后端 businessType）。
 */
const BUSINESS_TYPE_LABEL: Record<number, string> = {
	0: "其它",
	1: "新增",
	2: "修改",
	3: "删除",
	4: "授权",
	5: "导出",
	6: "导入",
	7: "强退",
	8: "生成代码",
	9: "清空数据",
};

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
		"30d": 30,
	};
	return [end.subtract(amountMap[range], "day"), end];
}

/**
 * 将操作模块与业务类型拼装为操作描述文案。
 *
 * @param {SysOperLog} - 操作日志记录。
 * @returns {string} - 操作描述文案。
 */
export function formatOperAction(log: SysOperLog): string {
	const typeLabel =
		log.businessType !== undefined
			? BUSINESS_TYPE_LABEL[log.businessType]
			: undefined;
	if (log.title && typeLabel && typeLabel !== "其它") {
		return `${log.title}${typeLabel}`;
	}
	return log.title ?? "-";
}
