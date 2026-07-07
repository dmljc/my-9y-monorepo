import dayjs, { type Dayjs } from "dayjs";
import type { BarChartYAxisConfig } from "@/components/BarChart";
import type { PieChartItem } from "@/components/PieChart";

/** 筛选条件 */
export interface FilterState {
	timeRange: [Dayjs, Dayjs] | null;
}

/** 柱状图轴数据 */
export interface BarChartAxisData {
	xAxisData: string[];
	yAxisData: number[];
}

/** 页面三个图表的数据集合 */
export interface StatisticsChartData {
	barAxisData: BarChartAxisData;
	riskPieData: PieChartItem[];
	statusPieData: PieChartItem[];
}

/** 柱状图 Y 轴刻度 */
export const BAR_Y_AXIS: BarChartYAxisConfig = {
	min: 0,
	max: 250,
	interval: 50,
};

/** 柱状图 mock 每日基准值（接入 API 后删除）。 */
const BAR_BASE_VALUES = [
	170, 120, 80, 200, 130, 160, 80, 210, 190, 90, 60, 150,
];

/** 高中低危饼图 mock 基准数据（接入 API 后删除）。 */
const RISK_PIE_BASE: PieChartItem[] = [
	{ name: "高危", value: 76, color: "#1890ff" },
	{ name: "中危", value: 12, color: "#b37feb" },
	{ name: "低危", value: 12, color: "#f759ab" },
];

/** 报警状态饼图 mock 基准数据（接入 API 后删除）。 */
const STATUS_PIE_BASE: PieChartItem[] = [
	{ name: "已完成", value: 50, color: "#52c41a" },
	{ name: "未运行", value: 20, color: "#fadb14" },
	{ name: "已停止", value: 30, color: "#b37feb" },
	{ name: "停止中", value: 30, color: "#13c2c2" },
	{ name: "已报满", value: 30, color: "#f759ab" },
	{ name: "运行中", value: 30, color: "#1890ff" },
];

/**
 * 返回默认筛选条件（最近 7 天）。
 *
 * @returns {FilterState} - 含起止日期的筛选状态。
 */
export const getDefaultFilter = (): FilterState => ({
	timeRange: [dayjs().subtract(6, "day"), dayjs()],
});

/**
 * 根据已应用的筛选条件构建图表数据。
 * 接入接口后：在此调用 API，并将响应映射为 StatisticsChartData。
 *
 * @param {FilterState} - 点击「查询」后生效的筛选条件。
 * @returns {StatisticsChartData} - 三个图表的展示数据。
 */
export function buildChartData(filter: FilterState): StatisticsChartData {
	const days = getDayCount(filter.timeRange);
	const scale = calculateScale(days);

	return {
		barAxisData: buildBarAxisData(scale, filter.timeRange),
		riskPieData: scalePieData(RISK_PIE_BASE, scale),
		statusPieData: scalePieData(STATUS_PIE_BASE, scale),
	};
}

/**
 * 计算时间范围包含的天数。
 *
 * @param {[Dayjs, Dayjs] | null} - 起止日期，为空时按 7 天计。
 * @returns {number} - 至少为 1 的天数。
 */
function getDayCount(timeRange: [Dayjs, Dayjs] | null): number {
	if (!timeRange) return 7;
	const [start, end] = timeRange;
	return Math.max(1, end.diff(start, "day") + 1);
}

/**
 * 以 7 天为基准按天数缩放 mock 数据幅度。
 *
 * @param {number} - 筛选区间天数。
 * @returns {number} - 介于 0.75 与 1.8 之间的缩放系数。
 */
function calculateScale(days: number): number {
	return Math.min(1.8, Math.max(0.75, days / 7));
}

/**
 * 构建柱状图 X/Y 轴数据。
 *
 * @param {number} - mock 缩放系数。
 * @param {[Dayjs, Dayjs] | null} - 起止日期。
 * @returns {BarChartAxisData} - 柱状图轴数据。
 */
function buildBarAxisData(
	scale: number,
	timeRange: [Dayjs, Dayjs] | null,
): BarChartAxisData {
	const days = getDayCount(timeRange);
	const start = timeRange?.[0] ?? dayjs().subtract(6, "day");

	return {
		xAxisData: Array.from({ length: days }, (_, index) =>
			start.add(index, "day").format("MM/DD"),
		),
		yAxisData: Array.from({ length: days }, (_, index) =>
			Math.round(BAR_BASE_VALUES[index % BAR_BASE_VALUES.length] * scale),
		),
	};
}

/**
 * 按缩放系数调整饼图各项数值。
 *
 * @param {PieChartItem[]} - 基准饼图数据。
 * @param {number} - 缩放系数。
 * @returns {PieChartItem[]} - 缩放后的饼图数据。
 */
function scalePieData(baseData: PieChartItem[], scale: number): PieChartItem[] {
	return baseData.map((item) => ({
		...item,
		value: Math.max(1, Math.round(item.value * scale)),
	}));
}
