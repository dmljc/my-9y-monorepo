import type { EChartsOption } from "echarts";
import type {
	LineChartBuildContext,
	LineChartsResolvedProps,
} from "./interface";

/** 蓝湖舞台逻辑宽度，与 ipad `cqw` 分母一致 */
const STAGE_WIDTH = 1400;

const AXIS_LABEL_COLOR = "#bfbfbf";
const SPLIT_LINE_COLOR = "#f0f0f0";
const AXIS_LINE_COLOR = "#e8e8e8";
const FONT_FAMILY =
	'"HarmonyOS Sans SC", "HarmonyOS_Sans_SC", "PingFang SC", "Microsoft YaHei", sans-serif';

/**
 * 按舞台 `container-type` 祖先计算相对 1400 的缩放比，使 ECharts 字号与 cqw 同步。
 *
 * @param {HTMLElement} - 图表容器或包裹节点。
 * @returns {number} - 舞台宽度 / 1400；找不到容器时返回 1。
 */
export function getStageScale(el: HTMLElement): number {
	let node: HTMLElement | null = el.parentElement;
	while (node) {
		const type = getComputedStyle(node).containerType;
		if (type === "size" || type === "inline-size") {
			return node.clientWidth / STAGE_WIDTH;
		}
		node = node.parentElement;
	}
	return 1;
}

/**
 * 组装 ECharts option。
 * 需要调整图表视觉（网格、坐标轴、折线样式等）时，优先修改此函数。
 */
export function buildLineChartOption(
	{
		xAxisData,
		yAxisData,
		yAxis,
		lineColor,
		lineWidth,
		valueFormatter,
	}: LineChartsResolvedProps,
	{ scale }: LineChartBuildContext,
): EChartsOption {
	const isEmpty = xAxisData.length === 0;
	const yMin = yAxis.min ?? 0;
	const fontSize = 11 * scale;
	const px = (value: number) => value * scale;

	// echarts v6 类型声明中，axis/grid 的联合类型与新增字段（outerBoundsMode、
	// nameMoveOverlap）之间的交叉类型未能正确分发，直接内联对象字面量会触发
	// 「excess property」误报；先赋值给变量再引用，绕开该联合类型的字面量校验。
	const gridOption = {
		left: px(28),
		right: px(8),
		top: px(8),
		bottom: px(24),
		outerBoundsMode: "none" as const,
	};
	const xAxisOption = {
		type: "category" as const,
		data: xAxisData,
		show: true,
		boundaryGap: false,
		nameMoveOverlap: false,
		axisTick: { show: false },
		axisLine: {
			show: true,
			lineStyle: { color: AXIS_LINE_COLOR, width: px(1) },
		},
		splitLine: { show: false },
		axisLabel: {
			show: true,
			interval: 0,
			hideOverlap: true,
			color: AXIS_LABEL_COLOR,
			fontSize,
			fontFamily: FONT_FAMILY,
			margin: px(8),
		},
	};
	const yAxisOption = {
		type: "value" as const,
		min: yMin,
		max: yAxis.max,
		interval: yAxis.interval,
		show: true,
		nameMoveOverlap: false,
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: {
			show: true,
			showMinLabel: yMin !== 0,
			color: AXIS_LABEL_COLOR,
			fontSize,
			fontFamily: FONT_FAMILY,
			margin: px(8),
		},
		splitLine: {
			show: true,
			lineStyle: { color: SPLIT_LINE_COLOR, type: "solid" as const, width: 1 },
		},
	};

	return {
		color: [lineColor],
		grid: gridOption,
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "line",
				lineStyle: { color: AXIS_LINE_COLOR, width: 1 },
			},
			valueFormatter: (value) => valueFormatter(Number(value)),
		},
		xAxis: xAxisOption,
		yAxis: yAxisOption,
		series: [
			{
				type: "line",
				data: isEmpty ? [] : yAxisData,
				showSymbol: false,
				symbol: "none",
				smooth: false,
				clip: false,
				sampling: "lttb",
				lineStyle: {
					width: px(lineWidth),
					color: lineColor,
				},
			},
		],
	};
}
