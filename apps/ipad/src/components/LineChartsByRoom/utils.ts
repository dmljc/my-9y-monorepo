import type { EChartsOption } from "echarts";
import type {
	LineChartBuildContext,
	LineChartLayout,
	LineChartPoint,
	LineChartResolvedSeries,
	LineChartSeriesItem,
} from "./interface";

/** 蓝湖舞台逻辑宽度，与 ipad `cqw` 分母一致 */
const STAGE_WIDTH = 1400;

/** 与截图接近的默认色板：橙 / 薄荷绿 / 蓝紫 */
const DEFAULT_COLORS = ["#EE8C45", "#6BC7A6", "#7492DB"];

/** 一屏默认展示的独立 Y 轴条数 */
export const DEFAULT_PAGE_SIZE = 3;

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;
const MS_MINUTE = 60 * 1000;

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
 * 按缩放比计算 dataZoom / grid 像素留白。
 *
 * @param {number} - 相对 1400 舞台的缩放比。
 * @returns {LineChartLayout} - 与 option 中 left/right/top/height 一致的布局。
 */
export function getLineChartLayout(scale: number): LineChartLayout {
	const zoomBtnSize = 22 * scale;
	const zoomBtnGap = 6 * scale;
	const dateHeight = 16 * scale;
	const sideGutter = 56 * scale;
	return {
		left: 32 * scale + sideGutter,
		right: 16 * scale + sideGutter,
		sliderRight: 16 * scale + zoomBtnSize * 2 + zoomBtnGap + 8 * scale,
		dateHeight,
		dataZoomTop: dateHeight + 4 * scale,
		dataZoomHeight: 22 * scale,
		zoomBtnSize,
		zoomBtnGap,
	};
}

/**
 * 将业务点转为毫秒时间戳。
 *
 * @param {LineChartPoint["time"]} - 毫秒时间戳或可解析的日期字符串。
 * @returns {number} - 毫秒时间戳；无法解析时为 NaN。
 */
function toTimestamp(time: LineChartPoint["time"]): number {
	if (typeof time === "number") {
		return time;
	}
	const parsed = Date.parse(time);
	return Number.isNaN(parsed) ? Number(time) : parsed;
}

/**
 * 补齐颜色并把数据点规范为 `[时间戳, 数值]`，按时间升序。
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
		min: item.min,
		max: item.max,
		step: item.step,
		smooth: item.smooth,
		data: item.data
			.map((point): [number, number] => [toTimestamp(point.time), point.value])
			.filter(([time]) => Number.isFinite(time))
			.sort((a, b) => a[0] - b[0]),
	}));
}

/**
 * 收集全部序列的时间范围。
 *
 * @param {LineChartResolvedSeries[]} - 已规范化的序列。
 * @returns {[number, number] | null} - `[min, max]`；无数据时为 null。
 */
export function getTimeExtent(
	series: LineChartResolvedSeries[],
): [number, number] | null {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (const item of series) {
		for (const [time] of item.data) {
			if (time < min) min = time;
			if (time > max) max = time;
		}
	}
	if (!Number.isFinite(min) || !Number.isFinite(max)) {
		return null;
	}
	return [min, max];
}

/**
 * 按「最近 N 天」计算 dataZoom 起止百分比（窗口贴齐数据末尾）。
 *
 * @param {[number, number] | null} - 全量时间范围；无数据时为 null。
 * @param {number} - 初始可见窗口天数。
 * @returns {{ start: number; end: number }} - dataZoom 百分比。
 */
export function computeDefaultZoom(
	extent: [number, number] | null,
	defaultRangeDays: number,
): { start: number; end: number } {
	if (!extent) {
		return { start: 0, end: 100 };
	}
	const span = extent[1] - extent[0];
	if (span <= 0) {
		return { start: 0, end: 100 };
	}
	const window = Math.min(span, defaultRangeDays * MS_DAY);
	const start = ((extent[1] - window - extent[0]) / span) * 100;
	return { start: Math.max(0, start), end: 100 };
}

/**
 * 以当前窗口中心缩放 dataZoom 百分比。
 *
 * @param {{ start: number; end: number }} - 当前起止百分比。
 * @param {number} - 小于 1 放大，大于 1 缩小。
 * @returns {{ start: number; end: number }} - 新的起止百分比。
 */
export function computeZoomWindow(
	current: { start: number; end: number },
	factor: number,
): { start: number; end: number } {
	const span = Math.max(current.end - current.start, 0.5);
	const center = (current.start + current.end) / 2;
	const nextSpan = Math.min(100, Math.max(0.8, span * factor));
	let start = center - nextSpan / 2;
	let end = center + nextSpan / 2;
	if (start < 0) {
		end = Math.min(100, end - start);
		start = 0;
	}
	if (end > 100) {
		start = Math.max(0, start - (end - 100));
		end = 100;
	}
	return { start, end };
}

/**
 * 转义 Tooltip HTML 文本，避免指标名注入标签。
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
 * 格式化 X 轴时间：整点日期边界只显示月日，其余显示月日+时分。
 *
 * @param {number} - 毫秒时间戳。
 * @returns {string} - 如 `08/12` 或 `08/11 16:00`。
 */
function formatAxisTime(value: number): string {
	const date = new Date(value);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hour = date.getHours();
	const minute = date.getMinutes();
	if (hour === 0 && minute === 0) {
		return `${month}/${day}`;
	}
	const hh = String(hour).padStart(2, "0");
	const mm = String(minute).padStart(2, "0");
	return `${month}/${day} ${hh}:${mm}`;
}

/**
 * 格式化 dataZoom 轨道两端日期。
 *
 * @param {number} - 毫秒时间戳。
 * @returns {string} - `YYYY/MM/DD`。
 */
export function formatRangeDate(value: number): string {
	const date = new Date(value);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}/${month}/${day}`;
}

/**
 * 将窗口时长格式化为「N天 / N小时 / N分钟」。
 *
 * @param {number} - 窗口起点毫秒。
 * @param {number} - 窗口终点毫秒。
 * @returns {string} - 如 `7天`。
 */
export function formatRangeDuration(startMs: number, endMs: number): string {
	const span = Math.max(0, endMs - startMs);
	if (span >= MS_DAY) {
		return `${Math.max(Math.round(span / MS_DAY), 1)}天`;
	}
	if (span >= MS_HOUR) {
		return `${Math.max(Math.round(span / MS_HOUR), 1)}小时`;
	}
	if (span >= MS_MINUTE) {
		return `${Math.max(Math.round(span / MS_MINUTE), 1)}分钟`;
	}
	return `${Math.max(Math.round(span / 1000), 1)}秒`;
}

/**
 * 去掉小数末尾多余的 0。
 *
 * @param {string} - 数字字符串。
 * @returns {string} - 精简后的文本。
 */
function trimDecimal(text: string): string {
	if (!text.includes(".")) {
		return text;
	}
	return text.replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * 格式化 Y 轴刻度：满万用「万」，否则保留数据本身的小数。
 *
 * @param {number} - 刻度数值。
 * @returns {string} - 如 `6553.5`、`1.31万`。
 */
export function formatYAxisValue(value: number): string {
	if (!Number.isFinite(value)) {
		return "";
	}
	const abs = Math.abs(value);
	if (abs >= 10000) {
		const wan = value / 10000;
		const digits = abs >= 1_000_000 ? 0 : abs >= 100_000 ? 1 : 2;
		return `${trimDecimal(wan.toFixed(digits))}万`;
	}
	if (Math.abs(value - Math.round(value)) < 1e-8) {
		return String(Math.round(value));
	}
	if (abs >= 100) {
		return trimDecimal(value.toFixed(1));
	}
	if (abs >= 1) {
		return trimDecimal(value.toFixed(2));
	}
	return trimDecimal(value.toFixed(4));
}

/**
 * 判断刻度是否为轴的最小或最大端点（中间值如 200 不展示）。
 *
 * @param {number} - 当前刻度。
 * @param {number} - 轴下限。
 * @param {number} - 轴上限。
 * @returns {boolean} - 是否为两端刻度。
 */
function isYAxisEndpoint(value: number, min: number, max: number): boolean {
	const span = Math.abs(max - min);
	const eps = Math.max(span * 1e-4, 1e-8);
	return Math.abs(value - min) <= eps || Math.abs(value - max) <= eps;
}

/**
 * 生成只显示数据最小 / 最大两端的 Y 轴 min/max/formatter。
 *
 * @param {number | undefined} - 业务指定下限。
 * @param {number | undefined} - 业务指定上限。
 * @returns {{ min: number | ((extent: { min: number }) => number); max: number | ((extent: { min: number; max: number }) => number); formatter: (value: number) => string; isEndpoint: (value: number) => boolean }} - Y 轴两端配置。
 */
function createYAxisEndpoints(
	fixedMin: number | undefined,
	fixedMax: number | undefined,
) {
	const bound = {
		min: fixedMin ?? 0,
		max: fixedMax ?? 0,
	};

	return {
		min:
			fixedMin ??
			((extent: { min: number }) => {
				bound.min = extent.min;
				return extent.min;
			}),
		max:
			fixedMax ??
			((extent: { min: number; max: number }) => {
				bound.min = extent.min;
				bound.max = extent.max > extent.min ? extent.max : extent.min;
				return bound.max;
			}),
		formatter: (value: number) => {
			if (!isYAxisEndpoint(value, bound.min, bound.max)) {
				return "";
			}
			return formatYAxisValue(value);
		},
		isEndpoint: (value: number) => isYAxisEndpoint(value, bound.min, bound.max),
	};
}

/**
 * 组装自定义 Tooltip：表头「属性名称 / 原始值」+ 各序列色点与数值。
 *
 * @param {LineChartResolvedSeries[]} - 全部序列，用于跨 grid 汇总。
 * @param {number} - 舞台缩放比。
 * @param {(value: number, seriesName: string) => string} - 数值格式化。
 * @returns {(raw: unknown) => string} - ECharts tooltip formatter。
 */
function createTooltipFormatter(
	series: LineChartResolvedSeries[],
	scale: number,
	valueFormatter: (value: number, seriesName: string) => string,
) {
	const font = Math.max(12 * scale, 10);
	const headerFont = Math.max(12 * scale, 10);
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
				const display = escapeHtml(valueFormatter(value, item.name));
				return `<div style="display:flex;align-items:center;justify-content:space-between;gap:${24 * scale}px;margin-top:${gap}px">
<span style="display:flex;align-items:center;gap:${6 * scale}px;color:#333333;font-size:${font}px">
<span style="width:${dot}px;height:${dot}px;border-radius:50%;background:${item.color};flex:none"></span>
<span>${escapeHtml(item.name)}</span>
</span>
<span style="color:#1d2129;font-size:${font}px;font-weight:600">${display}</span>
</div>`;
			})
			.join("");

		return `<div style="min-width:${minWidth}px">
<div style="display:flex;justify-content:space-between;gap:${24 * scale}px;color:#86909c;font-size:${headerFont}px">
<span>属性名称</span>
<span>原始值</span>
</div>
${rows}
</div>`;
	};
}

/**
 * 组装左侧多独立 Y 轴折线图的 ECharts option（多 grid 纵向堆叠 + 顶部 dataZoom）。
 *
 * @param {LineChartResolvedSeries[]} - 已规范化的序列。
 * @param {LineChartBuildContext} - 容器尺寸、缩放与窗口配置。
 * @returns {EChartsOption} - 完整图表配置。
 */
export function buildLineChartOption(
	series: LineChartResolvedSeries[],
	context: LineChartBuildContext,
): EChartsOption {
	const { width, height, scale, zoom, valueFormatter } = context;
	const layout = getLineChartLayout(scale);
	const count = Math.max(series.length, 1);
	const fontSize = 12 * scale;
	const dataZoomGap = 10 * scale;
	const gridGap = 6 * scale;
	const xLabelSpace = 32 * scale;
	const top0 = layout.dataZoomTop + layout.dataZoomHeight + dataZoomGap;
	const remain = Math.max(height - top0 - xLabelSpace - gridGap * (count - 1), 0);
	const gridHeight = remain / count;
	const timeExtent = getTimeExtent(series);

	const gridOption = Array.from({ length: count }, (_, index) => ({
		left: layout.left,
		right: layout.right,
		top: top0 + index * (gridHeight + gridGap),
		height: gridHeight,
		outerBoundsMode: "none" as const,
	}));

	const xAxisOption = Array.from({ length: count }, (_, index) => {
		const isLast = index === count - 1;
		return {
			type: "time" as const,
			gridIndex: index,
			min: timeExtent?.[0],
			max: timeExtent?.[1],
			show: true,
			nameMoveOverlap: false,
			axisTick: {
				show: isLast,
				length: 4 * scale,
				lineStyle: { color: "#c9cdd4" },
			},
			axisLine: {
				show: isLast,
				lineStyle: { color: "#e5e6eb" },
			},
			axisLabel: {
				show: isLast,
				color: "#86909c",
				fontSize,
				hideOverlap: true,
				margin: 10 * scale,
				formatter: (value: number) => formatAxisTime(value),
			},
			splitLine: { show: false },
			axisPointer: {
				show: true,
				lineStyle: { color: "#d9d9d9", width: 1 },
				label: { show: false },
			},
		};
	});

	const yAxisOption = Array.from({ length: count }, (_, index) => {
		const item = series[index];
		const color = item?.color ?? "#86909c";
		const itemMin = item?.min;
		const itemMax = item?.max;
		const hasFixedExtent = itemMin != null && itemMax != null;
		const endpoints = createYAxisEndpoints(
			hasFixedExtent ? Math.min(itemMin, itemMax) : undefined,
			hasFixedExtent ? Math.max(itemMin, itemMax) : undefined,
		);
		return {
			type: "value" as const,
			gridIndex: index,
			min: endpoints.min,
			max: endpoints.max,
			splitNumber: 1,
			scale: false,
			show: true,
			nameMoveOverlap: false,
			axisLine: {
				show: true,
				lineStyle: { color, width: 1.5 * scale },
			},
			axisTick: {
				show: true,
				inside: false,
				length: 4 * scale,
				lineStyle: { color, width: 1 },
				interval: (_index: number, value: string | number) =>
					endpoints.isEndpoint(Number(value)),
			},
			axisLabel: {
				show: true,
				showMinLabel: true,
				showMaxLabel: true,
				hideOverlap: false,
				color,
				fontSize,
				margin: 8 * scale,
				align: "right" as const,
				formatter: endpoints.formatter,
			},
			splitLine: {
				show: true,
				interval: (_index: number, value: string | number) =>
					endpoints.isEndpoint(Number(value)),
				lineStyle: { color, width: 1, type: "solid" as const },
			},
		};
	});

	const seriesOption = series.map((item, index) => ({
		type: "line" as const,
		name: item.name,
		data: item.data,
		xAxisIndex: index,
		yAxisIndex: index,
		showSymbol: item.data.length <= 120,
		symbol: "emptyCircle",
		symbolSize: 6 * scale,
		smooth: item.smooth ?? false,
		step: item.step || undefined,
		connectNulls: false,
		sampling: "lttb" as const,
		lineStyle: {
			width: 1.5 * scale,
			color: item.color,
		},
		itemStyle: {
			color: item.color,
			borderColor: item.color,
			borderWidth: Math.max(1 * scale, 1),
		},
		emphasis: {
			scale: false,
			lineStyle: { width: 1.5 * scale },
		},
		markLine: {
			silent: true,
			symbol: "none",
			animation: false,
			label: { show: false },
			lineStyle: {
				color: item.color,
				width: 1,
				type: "solid" as const,
			},
			data: [{ type: "min" as const }, { type: "max" as const }],
		},
	}));

	const xAxisIndex = Array.from({ length: count }, (_, index) => index);
	const sliderWidth = Math.max(width - layout.left - layout.sliderRight, 0);

	return {
		animationDuration: 300,
		axisPointer: {
			link: [{ xAxisIndex: "all" }],
		},
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
				xAxisIndex,
				filterMode: "filter",
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
				xAxisIndex,
				filterMode: "filter",
				start: zoom.start,
				end: zoom.end,
				zoomOnMouseWheel: true,
				moveOnMouseMove: true,
				moveOnMouseWheel: false,
			},
		],
		series: seriesOption,
	};
}
