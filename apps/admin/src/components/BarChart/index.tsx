import type { EChartsOption } from "echarts";
import { useEcharts } from "../hooks/useEcharts";
import styles from "./BarChart.module.css";

/** Y 轴刻度配置 */
export interface BarChartYAxisConfig {
	min?: number;
	max: number;
	interval?: number;
}

export interface BarChartProps {
	/** X 轴类目，与 yAxisData 一一对应 */
	xAxisData: string[];
	/** 柱体数值 */
	yAxisData: number[];
	/** Y 轴刻度，由业务页根据数据范围传入 */
	yAxis: BarChartYAxisConfig;
	/** 柱体颜色 */
	barColor?: string;
	/** 柱宽（像素） */
	barWidth?: number;
	/** Tooltip 数值展示格式 */
	valueFormatter?: (value: number) => string;
}

interface BarChartResolvedProps extends BarChartProps {
	barColor: string;
	barWidth: number;
	valueFormatter: (value: number) => string;
}

// 默认样式，其他页面可通过 props 覆盖
const DEFAULT_BAR_COLOR = "#1890ff";
const DEFAULT_BAR_WIDTH = 18;
const defaultValueFormatter = (value: number) => `${value} 次`;

/** 合并默认值，保证 buildBarChartOption 入参完整 */
function resolveProps(props: BarChartProps): BarChartResolvedProps {
	return {
		...props,
		barColor: props.barColor ?? DEFAULT_BAR_COLOR,
		barWidth: props.barWidth ?? DEFAULT_BAR_WIDTH,
		valueFormatter: props.valueFormatter ?? defaultValueFormatter,
	};
}

/**
 * 组装 ECharts option。
 * 需要调整图表视觉（网格、坐标轴、柱体样式等）时，优先修改此函数。
 */
function buildBarChartOption({
	xAxisData,
	yAxisData,
	yAxis,
	barColor,
	barWidth,
	valueFormatter,
}: BarChartResolvedProps): EChartsOption {
	return {
		color: [barColor],
		grid: { left: 44, right: 16, top: 16, bottom: 28 },
		tooltip: {
			trigger: "axis",
			axisPointer: { type: "shadow" },
			valueFormatter: (value) => valueFormatter(Number(value)),
		},
		xAxis: {
			type: "category",
			data: xAxisData,
			axisTick: { show: false },
			axisLine: { show: false },
			axisLabel: { color: "#86909c", fontSize: 12, margin: 12 },
		},
		yAxis: {
			type: "value",
			min: yAxis.min ?? 0,
			max: yAxis.max,
			interval: yAxis.interval,
			axisLine: { show: false },
			axisTick: { show: false },
			axisLabel: { color: "#86909c", fontSize: 12 },
			splitLine: { lineStyle: { color: "#eef0f3", type: "solid" } },
		},
		series: [
			{
				type: "bar",
				data: yAxisData,
				barWidth,
				barCategoryGap: "55%",
				itemStyle: {
					borderRadius: [5, 5, 0, 0],
					color: barColor,
				},
			},
		],
	};
}

const BarChart = (props: BarChartProps) => {
	const chartRef = useEcharts(buildBarChartOption(resolveProps(props)));

	return <div ref={chartRef} className={styles.container} />;
};

export default BarChart;
