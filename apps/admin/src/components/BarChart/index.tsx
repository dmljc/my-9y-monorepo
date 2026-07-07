import type { EChartsOption } from "echarts";
import { BarChart as BarChartSeries } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEchartsInit } from "../hooks/useEchartsInit";
import styles from "./BarChart.module.css";

echarts.use([BarChartSeries, GridComponent, TooltipComponent, CanvasRenderer]);

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
	const isEmpty = xAxisData.length === 0;
	// echarts v6 类型声明中，axis/grid 的联合类型与新增字段（outerBoundsMode、
	// nameMoveOverlap）之间的交叉类型未能正确分发，直接内联对象字面量会触发
	// 「excess property」误报；先赋值给变量再引用，绕开该联合类型的字面量校验。
	const gridOption = {
		left: 44,
		right: 16,
		top: 16,
		bottom: 28,
		// v6 默认开启防溢出，关闭以保持既有 grid 留白
		outerBoundsMode: "none" as const,
	};
	const xAxisOption = {
		type: "category" as const,
		data: xAxisData,
		show: true,
		boundaryGap: true,
		nameMoveOverlap: false,
		axisTick: { show: isEmpty },
		axisLine: {
			show: true,
			lineStyle: { color: isEmpty ? "#e5e6eb" : "transparent" },
		},
		axisLabel: {
			show: true,
			color: "#86909c",
			fontSize: 12,
			margin: 12,
		},
	};
	const yAxisOption = {
		type: "value" as const,
		min: yAxis.min ?? 0,
		max: yAxis.max,
		interval: yAxis.interval,
		show: true,
		nameMoveOverlap: false,
		axisLine: {
			show: true,
			lineStyle: { color: isEmpty ? "#e5e6eb" : "transparent" },
		},
		axisTick: { show: false },
		axisLabel: { show: true, color: "#86909c", fontSize: 12 },
		splitLine: {
			show: true,
			lineStyle: { color: "#eef0f3", type: "solid" as const },
		},
	};

	return {
		color: [barColor],
		grid: gridOption,
		tooltip: {
			trigger: "axis",
			axisPointer: { type: "shadow" },
			valueFormatter: (value) => valueFormatter(Number(value)),
		},
		xAxis: xAxisOption,
		yAxis: yAxisOption,
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
	const chartRef = useEchartsInit(buildBarChartOption(resolveProps(props)));

	return <div ref={chartRef} className={styles.container} />;
};

export default BarChart;
