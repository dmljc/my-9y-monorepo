import dayjs, { type Dayjs } from "dayjs";
import type { BarChartYAxisConfig } from "@/components/BarChart";
import type { PieChartItem } from "@/components/PieChart";
import type {
	AlarmByBuildingItem,
	AlarmByLevelItem,
	AlarmTrendData,
	StatisticsQuery,
} from "./interface";

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
	trendBarData: BarChartAxisData;
}

/** 空图表数据，用于加载前占位。 */
export const EMPTY_CHART_DATA: StatisticsChartData = {
	barAxisData: { xAxisData: [], yAxisData: [] },
	riskPieData: [],
	trendBarData: { xAxisData: [], yAxisData: [] },
};

/**
 * 返回默认筛选条件（最近 7 天）。
 *
 * @returns {FilterState} - 含起止日期的筛选状态。
 */
export const getDefaultFilter = (): FilterState => ({
	timeRange: [dayjs().subtract(6, "day"), dayjs()],
});

/**
 * 将筛选条件转为接口查询参数。
 *
 * @param {FilterState} - 点击「查询」后生效的筛选条件。
 * @returns {StatisticsQuery & { days: number }} - 时间范围与趋势天数。
 */
export function toStatisticsQuery(
	filter: FilterState,
): StatisticsQuery & { days: number } {
	const range = filter.timeRange ?? getDefaultFilter().timeRange;
	const [start, end] = range ?? [dayjs().subtract(6, "day"), dayjs()];
	const days = Math.max(1, end.diff(start, "day") + 1);

	return {
		startTime: start.format("YYYY-MM-DD"),
		endTime: `${end.format("YYYY-MM-DD")} 23:59:59`,
		days,
	};
}

/**
 * 将厂房报警统计转为柱状图数据。
 *
 * @param {AlarmByBuildingItem[]} - 厂房报警次数列表。
 * @returns {BarChartAxisData} - 柱状图轴数据。
 */
export function toBuildingBarData(
	items: AlarmByBuildingItem[],
): BarChartAxisData {
	const list = items ?? [];
	return {
		xAxisData: list.map((item) => item.building),
		yAxisData: list.map((item) => item.count),
	};
}

/**
 * 将告警等级统计转为饼图数据。
 *
 * @param {AlarmByLevelItem[]} - 等级分布列表。
 * @returns {PieChartItem[]} - 饼图数据项。
 */
export function toLevelPieData(items: AlarmByLevelItem[]): PieChartItem[] {
	return (items ?? []).map((item) => ({
		name: item.levelName,
		value: item.count,
		color: item.levelColor,
	}));
}

/**
 * 将告警趋势统计转为柱状图数据。
 *
 * @param {AlarmTrendData} - 趋势接口响应。
 * @returns {BarChartAxisData} - 柱状图轴数据。
 */
export function toTrendBarData(data: AlarmTrendData): BarChartAxisData {
	const trend = data?.trend ?? [];
	return {
		xAxisData: trend.map((point) => dayjs(point.date).format("MM/DD")),
		yAxisData: trend.map((point) => point.count),
	};
}

/**
 * 根据数据最大值计算柱状图 Y 轴刻度。
 *
 * @param {number[]} - 柱体数值列表。
 * @returns {BarChartYAxisConfig} - Y 轴配置。
 */
export function buildBarYAxis(values: number[]): BarChartYAxisConfig {
	const maxValue = values.length > 0 ? Math.max(...values) : 0;
	if (maxValue <= 0) {
		return { min: 0, max: 5, interval: 1 };
	}

	const ceiling = Math.ceil(maxValue / 5) * 5;
	const max = Math.max(ceiling, 5);
	const interval = Math.max(Math.ceil(max / 5), 1);

	return { min: 0, max, interval };
}
