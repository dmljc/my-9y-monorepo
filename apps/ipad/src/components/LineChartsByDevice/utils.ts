import type { EChartsOption } from "echarts";
import {
	buildTimeAxisTicks,
	clampTimeToNow,
	formatAxisTime,
	getLineChartLayout,
} from "../LineChartsByRoom/utils";
import type {
	LineChartBuildContext,
	LineChartPoint,
	LineChartResolvedSeries,
	LineChartSeriesItem,
} from "./interface";

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;
const AXIS_LABEL_COLOR = "#86909c";
const SPLIT_LINE_COLOR = "#f0f0f0";
const AXIS_LINE_COLOR = "#e5e6eb";
const TICK_COLOR = "#c9cdd4";
const FONT_FAMILY =
	'"HarmonyOS Sans SC", "HarmonyOS_Sans_SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const DEFAULT_COLORS = ["#EE8C45", "#6BC7A6", "#7492DB"];

/**
 * 将业务点转为 `[时间戳, 数值]`，按时间升序。
 *
 * @param {LineChartPoint[]} - 组件入参点列。
 * @returns {[number, number][]} - 可供 ECharts 使用的点。
 */
export function toChartPoints(data: LineChartPoint[]): [number, number][] {
	return data
		.map((point): [number, number] => {
			if (typeof point.time === "number") {
				return [point.time, point.value];
			}
			const parsed = Date.parse(point.time);
			const time = Number.isNaN(parsed) ? Number(point.time) : parsed;
			return [time, point.value];
		})
		.filter(([time]) => Number.isFinite(time))
		.sort((a, b) => a[0] - b[0]);
}

/**
 * 补齐颜色并把各序列点规范为 `[时间戳, 数值]`。
 *
 * @param {LineChartSeriesItem[]} - 组件入参序列。
 * @returns {LineChartResolvedSeries[]} - 可供 ECharts 使用的序列。
 */
export function resolveSeries(
	series: LineChartSeriesItem[],
): LineChartResolvedSeries[] {
	return series.map((item, index) => ({
		name: item.name,
		color: item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
		data: toChartPoints(item.data),
	}));
}

/**
 * 收集点列时间范围。
 *
 * @param {[number, number][]} - `[时间戳, 数值]`。
 * @returns {[number, number] | null} - `[min, max]`；无数据时为 null。
 */
export function getPointsExtent(
	points: [number, number][],
): [number, number] | null {
	if (!points.length) {
		return null;
	}
	let min = points[0][0];
	let max = points[0][0];
	for (const [time] of points) {
		if (time < min) min = time;
		if (time > max) max = time;
	}
	return [min, max];
}

/**
 * 按当前 X 轴可见窗口计算 Y 轴整数范围，随窗口内数据变化。
 *
 * @param {[number, number][]} - 全部折线点。
 * @param {[number, number] | null} - 可见时间区间。
 * @returns {{ min: number; max: number }} - 取整后的 Y 轴上下限。
 */
export function computeVisibleYExtent(
	points: [number, number][],
	viewExtent: [number, number] | null,
): { min: number; max: number } {
	const values: number[] = [];
	const start = viewExtent?.[0];
	const end = viewExtent?.[1];
	for (const [time, value] of points) {
		if (!Number.isFinite(value)) continue;
		if (start != null && time < start) continue;
		if (end != null && time > end) continue;
		values.push(value);
	}
	if (!values.length) {
		for (const [, value] of points) {
			if (Number.isFinite(value)) values.push(value);
		}
	}
	if (!values.length) {
		return { min: 0, max: 1 };
	}
	const minVal = Math.min(...values);
	const maxVal = Math.max(...values);
	const min = Math.floor(minVal);
	let max = Math.ceil(maxVal);
	if (max <= min) {
		max = min + 1;
	}
	return { min, max };
}

/**
 * 转义 Tooltip HTML 文本。
 *
 * @param {string} - 原始文本。
 * @returns {string} - 转义后的文本。
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * 在序列中取最接近目标时刻的数值。
 *
 * @param {[number, number][]} - `[时间戳, 数值]`，已按时间升序。
 * @param {number} - 目标时间戳。
 * @returns {number | null} - 最近一点的数值；无数据为 null。
 */
function findValueAtTime(
	data: [number, number][],
	time: number,
): number | null {
	if (data.length === 0) {
		return null;
	}
	const start = data[0][0];
	const end = data[data.length - 1][0];
	if (time < start || time > end) {
		return null;
	}
	let nearest = data[0];
	let best = Math.abs(data[0][0] - time);
	for (let i = 1; i < data.length; i += 1) {
		const dist = Math.abs(data[i][0] - time);
		if (dist < best) {
			best = dist;
			nearest = data[i];
		}
	}
	return nearest[1];
}

/**
 * 从 Tooltip 回调参数取出当前指示器时间。
 *
 * @param {unknown} - ECharts formatter 原始入参。
 * @returns {number | null} - 毫秒时间戳。
 */
function getHoveredTime(raw: unknown): number | null {
	const params = Array.isArray(raw) ? raw : raw ? [raw] : [];
	const first = params[0] as
		| {
				axisValue?: string | number;
				value?: number | [number, number];
		  }
		| undefined;
	if (!first) {
		return null;
	}
	if (first.axisValue != null && first.axisValue !== "") {
		const fromAxis = Number(first.axisValue);
		if (Number.isFinite(fromAxis)) {
			return fromAxis;
		}
	}
	if (Array.isArray(first.value)) {
		const fromValue = Number(first.value[0]);
		return Number.isFinite(fromValue) ? fromValue : null;
	}
	return null;
}

/**
 * 组装多系列同轴 Tooltip。
 *
 * @param {LineChartResolvedSeries[]} - 全部序列。
 * @param {number} - 舞台缩放比。
 * @param {(value: number) => string} - 数值格式化。
 * @returns {(raw: unknown) => string} - ECharts tooltip formatter。
 */
function createTooltipFormatter(
	series: LineChartResolvedSeries[],
	scale: number,
	valueFormatter: (value: number) => string,
) {
	const font = Math.max(12 * scale, 10);
	const gap = 8 * scale;
	const minWidth = 220 * scale;
	const dot = 8 * scale;

	return (raw: unknown) => {
		const time = getHoveredTime(raw);
		if (time == null) {
			return "";
		}
		const rows = series
			.map((item) => {
				const value = findValueAtTime(item.data, time);
				if (value == null) {
					return "";
				}
				return `<div style="display:flex;align-items:center;justify-content:space-between;gap:${24 * scale}px;margin-top:${gap}px">
<span style="display:flex;align-items:center;gap:${6 * scale}px;color:#333333;font-size:${font}px">
<span style="width:${dot}px;height:${dot}px;border-radius:50%;background:${item.color};flex:none"></span>
<span>${escapeHtml(item.name)}</span>
</span>
<span style="color:#1d2129;font-size:${font}px;font-weight:600">${escapeHtml(valueFormatter(value))}</span>
</div>`;
			})
			.join("");
		return `<div style="min-width:${minWidth}px">${rows}</div>`;
	};
}

/**
 * 组装多系列同轴时序折线图 option：X 轴与 LineChartsByRoom 相同（时间轴、自定义刻度、顶部滑块）。
 *
 * @param {LineChartResolvedSeries[]} - 已规范化的序列。
 * @param {number} - 折线宽度（蓝湖逻辑像素）。
 * @param {(value: number) => string} - Tooltip 数值格式化。
 * @param {LineChartBuildContext} - 容器尺寸、缩放与窗口配置。
 * @returns {EChartsOption} - 完整图表配置。
 */
export function buildLineChartOption(
	series: LineChartResolvedSeries[],
	lineWidth: number,
	valueFormatter: (value: number) => string,
	context: LineChartBuildContext,
): EChartsOption {
	const { width, scale, zoom, timeExtent, viewExtent } = context;
	const layout = getLineChartLayout(scale);
	const fontSize = 12 * scale;
	const dataZoomGap = 10 * scale;
	const xLabelSpace = 32 * scale;
	const top0 = layout.dataZoomTop + layout.dataZoomHeight + dataZoomGap;
	const points = series.flatMap((item) => item.data);
	const yExtent = computeVisibleYExtent(points, viewExtent);
	const now = Date.now();
	const viewSpan =
		viewExtent != null ? Math.max(viewExtent[1] - viewExtent[0], 0) : 0;
	const axisMax =
		viewExtent != null ? clampTimeToNow(viewExtent[1], now) : undefined;
	const axisMin = axisMax != null ? axisMax - viewSpan : viewExtent?.[0];
	const tickInterval = viewSpan >= MS_HOUR ? 10 * MS_MINUTE : MS_MINUTE;
	const axisTicks =
		axisMin != null && axisMax != null
			? buildTimeAxisTicks(axisMin, axisMax, tickInterval)
			: undefined;
	const sliderWidth = Math.max(width - layout.left - layout.sliderRight, 0);

	const gridOption = {
		left: layout.left,
		right: layout.right,
		top: top0,
		bottom: xLabelSpace,
		outerBoundsMode: "none" as const,
	};

	const xAxisOption = [
		{
			type: "time" as const,
			gridIndex: 0,
			min: axisMin,
			max: axisMax,
			show: true,
			nameMoveOverlap: false,
			axisTick: {
				show: true,
				customValues: axisTicks,
				length: 4 * scale,
				lineStyle: { color: TICK_COLOR },
			},
			axisLine: {
				show: true,
				lineStyle: { color: AXIS_LINE_COLOR },
			},
			axisLabel: {
				show: true,
				customValues: axisTicks,
				showMinLabel: true,
				showMaxLabel: true,
				color: AXIS_LABEL_COLOR,
				fontSize,
				fontFamily: FONT_FAMILY,
				hideOverlap: true,
				margin: 10 * scale,
				formatter: (value: number) => {
					if (axisMax != null && value > axisMax) {
						return "";
					}
					return formatAxisTime(value);
				},
			},
			splitLine: { show: false },
			axisPointer: {
				show: true,
				lineStyle: { color: "#d9d9d9", width: 1 },
				label: { show: false },
			},
		},
		{
			type: "time" as const,
			gridIndex: 0,
			min: timeExtent?.[0],
			max:
				timeExtent?.[1] != null
					? clampTimeToNow(timeExtent[1], now)
					: undefined,
			show: false,
		},
	];

	const ySpan = yExtent.max - yExtent.min;
	const yAxisOption = {
		type: "value" as const,
		min: yExtent.min,
		max: yExtent.max,
		minInterval: 1,
		interval: ySpan <= 8 ? 1 : Math.max(1, Math.ceil(ySpan / 8)),
		scale: false,
		show: true,
		nameMoveOverlap: false,
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: {
			show: true,
			showMinLabel: true,
			color: AXIS_LABEL_COLOR,
			fontSize,
			fontFamily: FONT_FAMILY,
			margin: 8 * scale,
			formatter: (value: number) => String(Math.round(value)),
		},
		splitLine: {
			show: true,
			lineStyle: {
				color: SPLIT_LINE_COLOR,
				type: "solid" as const,
				width: 1,
			},
		},
	};

	return {
		animationDuration: 300,
		grid: gridOption,
		xAxis: xAxisOption,
		yAxis: yAxisOption,
		tooltip: {
			trigger: "axis",
			axisPointer: { type: "line" },
			backgroundColor: "#ffffff",
			borderColor: "transparent",
			borderWidth: 0,
			padding: [12 * scale, 16 * scale],
			confine: true,
			extraCssText: `border-radius:${8 * scale}px;box-shadow:0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.12);`,
			formatter: createTooltipFormatter(series, scale, valueFormatter),
		},
		dataZoom: [
			{
				type: "slider",
				xAxisIndex: 1,
				filterMode: "none",
				showDetail: false,
				brushSelect: false,
				realtime: true,
				left: layout.left,
				right: layout.sliderRight,
				top: layout.dataZoomTop,
				height: layout.dataZoomHeight,
				width: sliderWidth || undefined,
				start: zoom.start,
				end: zoom.end,
				minValueSpan: MS_DAY,
				fillerColor: "rgba(116, 146, 219, 0.42)",
				borderColor: "transparent",
				backgroundColor: "#eef1f6",
				showDataShadow: false,
				handleSize: 18 * scale,
				moveHandleSize: 0,
				handleStyle: {
					color: "#ffffff",
					borderColor: "#7492db",
					borderWidth: 1,
					shadowBlur: 4 * scale,
					shadowColor: "rgba(0, 0, 0, 0.12)",
				},
				emphasis: {
					handleStyle: {
						color: "#ffffff",
						borderColor: "#7492db",
					},
				},
				dataBackground: {
					lineStyle: { color: "transparent" },
					areaStyle: { color: "transparent" },
				},
				selectedDataBackground: {
					lineStyle: { color: "transparent" },
					areaStyle: { color: "transparent" },
				},
			},
			{
				type: "inside",
				xAxisIndex: 1,
				filterMode: "none",
				start: zoom.start,
				end: zoom.end,
				minValueSpan: MS_DAY,
				zoomOnMouseWheel: false,
				moveOnMouseMove: true,
				moveOnMouseWheel: false,
			},
		],
		series: series.map((item) => ({
			type: "line" as const,
			name: item.name,
			data: item.data,
			xAxisIndex: 0,
			yAxisIndex: 0,
			showSymbol: false,
			smooth: false,
			clip: true,
			connectNulls: false,
			sampling: "lttb" as const,
			lineStyle: {
				width: lineWidth * scale,
				color: item.color,
			},
			itemStyle: {
				color: item.color,
				borderColor: item.color,
				borderWidth: Math.max(1 * scale, 1),
			},
		})),
	};
}
