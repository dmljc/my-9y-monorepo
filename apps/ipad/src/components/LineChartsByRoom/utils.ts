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
 * 判定「已贴齐当前时间」的容差，避免 1ms 误差导致还能再翻一页。
 */
export const NOW_PAGE_EPSILON_MS = 1000;

/**
 * 将时间戳钳到不超过当前时间。
 *
 * @param {number} - 原始时间戳。
 * @param {number} [nowMs] - 当前时间，默认 `Date.now()`。
 * @returns {number} - 不超过 now 的时间戳。
 */
export function clampTimeToNow(ms: number, nowMs = Date.now()): number {
	return Math.min(ms, nowMs);
}

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
	const dateHeight = 16 * scale;
	const sideGutter = 56 * scale;
	/** 左右各少留 20px，折线 canvas 总宽增加 */
	const extraCanvas = 20 * scale;
	const left = 32 * scale + sideGutter - extraCanvas;
	const right = 16 * scale + sideGutter - extraCanvas;
	return {
		left,
		right,
		sliderRight: right,
		dateHeight,
		dataZoomTop: dateHeight + 4 * scale,
		dataZoomHeight: 22 * scale,
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
 * 将时间轴补齐为「最近 N 天」，保证滑块总范围不随稀疏数据收缩。
 * 右端不超过当前时间。
 *
 * @param {[number, number] | null} - 数据实际时间范围。
 * @param {number} - 滑块总天数。
 * @param {number} [endMs] - 无数据时的右端时间戳。
 * @returns {[number, number]} - `[start, end]`。
 */
export function padTimeExtent(
	extent: [number, number] | null,
	totalRangeDays: number,
	endMs = Date.now(),
): [number, number] {
	const span = Math.max(totalRangeDays, 0) * MS_DAY;
	const now = Date.now();
	const end = clampTimeToNow(extent ? extent[1] : endMs, now);
	if (span <= 0) {
		return [end, end];
	}
	return [end - span, end];
}

/**
 * 由滑块窗口右端计算图表 X 轴范围（贴齐窗口末尾，右端不超过当前时间）。
 *
 * @param {number} - 滑块选中区间结束时间。
 * @param {number} - X 轴可见时长（毫秒）。
 * @param {number} [maxEndMs] - 右端上限，默认当前时间。
 * @returns {[number, number]} - `[start, end]`。
 */
export function computeViewExtent(
	sliderEndMs: number,
	axisRangeMs: number,
	maxEndMs = Date.now(),
): [number, number] {
	const window = Math.max(axisRangeMs, 0);
	const end = clampTimeToNow(sliderEndMs, maxEndMs);
	return [end - window, end];
}

/**
 * 按 `axisRangeMs` 一页平移 X 轴：上一页为 `[start-span, start]`，下一页为 `[end, end+span]`。
 * 下一页右端不超过当前时间；已贴齐当前时间时保持原值。
 *
 * @param {[number, number]} - 当前可见区间。
 * @param {-1 | 1} - `-1` 上一页，`1` 下一页。
 * @param {number} - 每页时长（毫秒）。
 * @param {[number, number]} - 允许的总范围（轨道起止）。
 * @param {number} [maxEndMs] - 右端上限，默认当前时间。
 * @returns {[number, number]} - 新的可见区间；越界时保持原值。
 */
export function pageViewExtent(
	current: [number, number],
	direction: -1 | 1,
	axisRangeMs: number,
	bounds: [number, number],
	maxEndMs = Date.now(),
): [number, number] {
	const span = Math.max(axisRangeMs, 0);
	if (span <= 0) {
		return current;
	}
	const boundStart = Math.min(bounds[0], bounds[1]);
	const boundEnd = clampTimeToNow(Math.max(bounds[0], bounds[1]), maxEndMs);
	if (direction < 0) {
		const end = current[0];
		const start = end - span;
		if (start < boundStart) {
			return current;
		}
		return [start, end];
	}
	if (current[1] >= boundEnd - NOW_PAGE_EPSILON_MS) {
		return current;
	}
	const end = Math.min(current[1] + span, boundEnd);
	if (end <= current[1]) {
		return current;
	}
	return [end - span, end];
}

/**
 * 生成不超出区间的 X 轴刻度，避免 ECharts 为对齐整分而把右端扩到当前时间之后。
 *
 * @param {number} - 轴起点毫秒。
 * @param {number} - 轴终点毫秒。
 * @param {number} [intervalMs] - 中间刻度间隔，默认 1 分钟。
 * @returns {number[]} - 含两端的刻度时间戳。
 */
export function buildTimeAxisTicks(
	min: number,
	max: number,
	intervalMs = MS_MINUTE,
): number[] {
	if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
		return [];
	}
	if (max === min || intervalMs <= 0) {
		return [min];
	}
	const ticks = [min];
	let next = Math.floor(min / intervalMs) * intervalMs + intervalMs;
	if (next <= min) {
		next += intervalMs;
	}
	while (next < max) {
		ticks.push(next);
		next += intervalMs;
	}
	ticks.push(max);
	return ticks;
}

/**
 * 按「最近一段时间」计算 dataZoom 起止百分比（窗口贴齐时间轴末尾）。
 *
 * @param {[number, number] | null} - 全量时间范围；无数据时为 null。
 * @param {number} - 初始可见窗口时长（毫秒）。
 * @returns {{ start: number; end: number }} - dataZoom 百分比。
 */
export function computeDefaultZoom(
	extent: [number, number] | null,
	windowMs: number,
): { start: number; end: number } {
	if (!extent) {
		return { start: 0, end: 100 };
	}
	const span = extent[1] - extent[0];
	if (span <= 0) {
		return { start: 0, end: 100 };
	}
	const window = Math.min(span, Math.max(windowMs, 0));
	const start = ((extent[1] - window - extent[0]) / span) * 100;
	return { start: Math.max(0, start), end: 100 };
}

/**
 * 将滑块窗口对齐到整天步幅：起点、终点相对轨道左端均为整天，时长至少 1 天。
 *
 * @param {number} - 窗口起点毫秒。
 * @param {number} - 窗口终点毫秒。
 * @param {[number, number]} - 轨道总时间范围。
 * @returns {{ start: number; end: number; from: number; to: number }} - 对齐后的百分比与精确起止时间。
 */
export function snapZoomWindowDays(
	startMs: number,
	endMs: number,
	extent: [number, number],
): { start: number; end: number; from: number; to: number } {
	const total = extent[1] - extent[0];
	const fallback = {
		start: 0,
		end: 100,
		from: extent[0],
		to: extent[1],
	};
	if (total <= 0) {
		return fallback;
	}
	const snapToDay = (ms: number) =>
		extent[0] + Math.round((ms - extent[0]) / MS_DAY) * MS_DAY;
	let from = Math.min(
		Math.max(snapToDay(startMs), extent[0]),
		extent[1] - MS_DAY,
	);
	let to = Math.min(
		Math.max(snapToDay(endMs), extent[0] + MS_DAY),
		extent[1],
	);
	if (to - from < MS_DAY) {
		to = from + MS_DAY;
		if (to > extent[1]) {
			to = extent[1];
			from = to - MS_DAY;
		}
	}
	return {
		start: ((from - extent[0]) / total) * 100,
		end: ((to - extent[0]) / total) * 100,
		from,
		to,
	};
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
 * 格式化 X 轴时间：5 分钟窗口用 `HH:mm`，跨天零点用 `MM/DD`。
 *
 * @param {number} - 毫秒时间戳。
 * @returns {string} - 如 `18:35` 或 `08/11`。
 */
export function formatAxisTime(value: number): string {
	const date = new Date(value);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();
	if (hour === 0 && minute === 0 && second === 0) {
		return `${month}/${day}`;
	}
	const hh = String(hour).padStart(2, "0");
	const mm = String(minute).padStart(2, "0");
	if (second !== 0) {
		const ss = String(second).padStart(2, "0");
		return `${hh}:${mm}:${ss}`;
	}
	return `${hh}:${mm}`;
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
 * 将 Y 轴数据范围规范为有限区间；无数据或非法 extent 时回落到 0～1，保证两端刻度可绘制。
 *
 * @param {number} - 原始下限。
 * @param {number} - 原始上限。
 * @returns {{ min: number; max: number }} - 可用于坐标轴的区间。
 */
function normalizeYExtent(min: number, max: number): { min: number; max: number } {
	if (!Number.isFinite(min) || !Number.isFinite(max)) {
		return { min: 0, max: 1 };
	}
	if (max < min) {
		return { min: max, max: min };
	}
	if (max === min) {
		return min === 0 ? { min: 0, max: 1 } : { min, max };
	}
	return { min, max };
}

/**
 * 生成只显示数据最小 / 最大两端的 Y 轴 min/max/formatter。
 *
 * @param {number | undefined} - 业务指定下限。
 * @param {number | undefined} - 业务指定上限。
 * @returns {{ min: number | ((extent: { min: number; max: number }) => number); max: number | ((extent: { min: number; max: number }) => number); formatter: (value: number) => string; isEndpoint: (value: number) => boolean }} - Y 轴两端配置。
 */
function createYAxisEndpoints(
	fixedMin: number | undefined,
	fixedMax: number | undefined,
) {
	const initial =
		fixedMin != null && fixedMax != null
			? normalizeYExtent(fixedMin, fixedMax)
			: { min: 0, max: 1 };
	const bound = { min: initial.min, max: initial.max };

	const commitExtent = (extent: { min: number; max: number }) => {
		const next = normalizeYExtent(extent.min, extent.max);
		bound.min = next.min;
		bound.max = next.max;
		return next;
	};

	return {
		min:
			fixedMin ??
			((extent: { min: number; max: number }) => commitExtent(extent).min),
		max:
			fixedMax ??
			((extent: { min: number; max: number }) => commitExtent(extent).max),
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
	const { width, height, scale, zoom, valueFormatter, timeExtent, viewExtent } =
		context;
	const layout = getLineChartLayout(scale);
	const count = Math.max(series.length, 1);
	const fontSize = 12 * scale;
	const dataZoomGap = 10 * scale;
	const gridGap = 6 * scale;
	const xLabelSpace = 32 * scale;
	const top0 = layout.dataZoomTop + layout.dataZoomHeight + dataZoomGap;
	const remain = Math.max(height - top0 - xLabelSpace - gridGap * (count - 1), 0);
	const gridHeight = remain / count;

	const gridOption = Array.from({ length: count }, (_, index) => ({
		left: layout.left,
		right: layout.right,
		top: top0 + index * (gridHeight + gridGap),
		height: gridHeight,
		outerBoundsMode: "none" as const,
	}));

	const now = Date.now();
	const viewSpan =
		viewExtent != null ? Math.max(viewExtent[1] - viewExtent[0], 0) : 0;
	const axisMax =
		viewExtent != null ? clampTimeToNow(viewExtent[1], now) : undefined;
	const axisMin =
		axisMax != null ? axisMax - viewSpan : viewExtent?.[0];
	const tickInterval = viewSpan >= MS_HOUR ? 10 * MS_MINUTE : MS_MINUTE;
	const axisTicks =
		axisMin != null && axisMax != null
			? buildTimeAxisTicks(axisMin, axisMax, tickInterval)
			: undefined;

	const xAxisOption = [
		...Array.from({ length: count }, (_, index) => {
			const isLast = index === count - 1;
			return {
				type: "time" as const,
				gridIndex: index,
				min: axisMin,
				max: axisMax,
				show: true,
				nameMoveOverlap: false,
				axisTick: {
					show: isLast,
					customValues: axisTicks,
					length: 4 * scale,
					lineStyle: { color: "#c9cdd4" },
				},
				axisLine: {
					show: isLast,
					lineStyle: { color: "#e5e6eb" },
				},
				axisLabel: {
					show: isLast,
					customValues: axisTicks,
					showMinLabel: true,
					showMaxLabel: true,
					color: "#86909c",
					fontSize,
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
			};
		}),
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

	const yAxisOption = Array.from({ length: count }, (_, index) => {
		const item = series[index];
		const color = item?.color ?? "#86909c";
		const itemMin = item?.min;
		const itemMax = item?.max;
		const hasFixedExtent = itemMin != null && itemMax != null;
		const hasData = Boolean(item?.data.length);
		const endpoints = createYAxisEndpoints(
			hasFixedExtent ? Math.min(itemMin, itemMax) : hasData ? undefined : 0,
			hasFixedExtent ? Math.max(itemMin, itemMax) : hasData ? undefined : 1,
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
				inside: true,
				length: 4 * scale,
				lineStyle: { color, width: 1 },
				interval: (_index: number, value: string | number) =>
					endpoints.isEndpoint(Number(value)),
			},
			axisLabel: {
				show: hasData || hasFixedExtent,
				showMinLabel: true,
				showMaxLabel: true,
				hideOverlap: false,
				color,
				fontSize,
				margin: 8 * scale,
				align: "right" as const,
				formatter: endpoints.formatter,
			},
			splitLine: { show: false },
		};
	});

	const seriesOption = series.map((item, index) => ({
		type: "line" as const,
		name: item.name,
		data: item.data,
		xAxisIndex: index,
		yAxisIndex: index,
		showSymbol: false,
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
	}));

	const seriesAxisIndex = Array.from({ length: count }, (_, index) => index);
	const sliderAxisIndex = count;
	const sliderWidth = Math.max(width - layout.left - layout.sliderRight, 0);

	return {
		animationDuration: 300,
		axisPointer: {
			link: [{ xAxisIndex: seriesAxisIndex }],
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
				xAxisIndex: sliderAxisIndex,
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
				maxValueSpan: MS_DAY,
				zoomLock: true,
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
				xAxisIndex: sliderAxisIndex,
				filterMode: "none",
				start: zoom.start,
				end: zoom.end,
				minValueSpan: MS_DAY,
				maxValueSpan: MS_DAY,
				zoomLock: true,
				zoomOnMouseWheel: false,
				moveOnMouseMove: false,
				moveOnMouseWheel: false,
			},
		],
		series: seriesOption,
	};
}
