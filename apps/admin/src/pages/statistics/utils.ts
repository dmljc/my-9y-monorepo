import dayjs, { type Dayjs } from "dayjs";
import type { BarChartYAxisConfig } from "@/components/BarChart";
import type { PieChartItem } from "@/components/PieChart";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 默认筛选：最近 7 天 */
export const DEFAULT_FILTER: FilterState = {
	timeRange: [dayjs().subtract(6, "day"), dayjs()],
};

/** 柱状图 Y 轴刻度 */
export const BAR_Y_AXIS: BarChartYAxisConfig = {
	min: 0,
	max: 250,
	interval: 50,
};

// ---------------------------------------------------------------------------
// Mock 数据（接入 API 后删除，改在 buildChartData 中映射接口响应）
// ---------------------------------------------------------------------------

const BAR_BASE_VALUES = [
	170, 120, 80, 200, 130, 160, 80, 210, 190, 90, 60, 150,
];

const RISK_PIE_BASE: PieChartItem[] = [
	{ name: "高危", value: 76, color: "#1890ff" },
	{ name: "中危", value: 12, color: "#b37feb" },
	{ name: "低危", value: 12, color: "#f759ab" },
];

const STATUS_PIE_BASE: PieChartItem[] = [
	{ name: "已完成", value: 50, color: "#52c41a" },
	{ name: "未运行", value: 20, color: "#fadb14" },
	{ name: "已停止", value: 30, color: "#b37feb" },
	{ name: "停止中", value: 30, color: "#13c2c2" },
	{ name: "已报满", value: 30, color: "#f759ab" },
	{ name: "运行中", value: 30, color: "#1890ff" },
];

// ---------------------------------------------------------------------------
// 数据构建（接入 API 时的主要扩展点）
// ---------------------------------------------------------------------------

/**
 * 根据已应用的筛选条件构建图表数据。
 * 接入接口后：在此调用 API，并将响应映射为 StatisticsChartData。
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

function getDayCount(timeRange: [Dayjs, Dayjs] | null): number {
	if (!timeRange) return 7;
	const [start, end] = timeRange;
	return Math.max(1, end.diff(start, "day") + 1);
}

/** 以 7 天为基准（1.0）按天数缩放，用于 mock 演示 */
function calculateScale(days: number): number {
	return Math.min(1.8, Math.max(0.75, days / 7));
}

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

function scalePieData(baseData: PieChartItem[], scale: number): PieChartItem[] {
	return baseData.map((item) => ({
		...item,
		value: Math.max(1, Math.round(item.value * scale)),
	}));
}
