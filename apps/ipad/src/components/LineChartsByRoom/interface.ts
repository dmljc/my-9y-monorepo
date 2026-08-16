/**
 * 折线数据点。
 */
export interface LineChartPoint {
	/** 时间戳（毫秒）或可被 Date 解析的字符串 */
	time: number | string;
	/** 指标数值 */
	value: number;
}

/**
 * 一条独立 Y 轴对应的折线。
 */
export interface LineChartSeriesItem {
	/** 图例 / Tooltip 展示名 */
	name: string;
	/** 时序数据，按时间升序 */
	data: LineChartPoint[];
	/** 折线与 Y 轴刻度颜色，不传则使用默认色板 */
	color?: string;
	/** Y 轴下限，不传则按数据自动 */
	min?: number;
	/** Y 轴上限，不传则按数据自动 */
	max?: number;
	/** 阶梯折线，适合 0/1 开关量 */
	step?: false | "start" | "middle" | "end";
	/** 是否平滑曲线 */
	smooth?: boolean;
}

/**
 * 左侧多独立 Y 轴折线图入参。
 */
export interface LineChartsProps {
	/** 每条序列独占一条 Y 轴与一块纵向 grid */
	series: LineChartSeriesItem[];
	/** 图表 X 轴可见时长（毫秒），默认 1 小时 */
	axisRangeMs?: number;
	/** 滑块轨道总天数，默认 7 */
	totalRangeDays?: number;
	/** 一屏展示的独立 Y 轴条数，默认 3 */
	pageSize?: number;
	/** Tooltip「原始值」格式化 */
	valueFormatter?: (value: number, seriesName: string) => string;
	/** 时间轴翻页：回传新的 1 小时查询区间 */
	onTimePage?: (range: { from: number; to: number }) => void;
	/** 滑块拖动结束：回传当前选中窗口（整天步幅），供趋势接口 `from` / `to` */
	onRangeChange?: (range: { from: number; to: number }) => void;
}

/**
 * 已补齐默认色的序列，供组装 option 使用。
 */
export interface LineChartResolvedSeries {
	/** 图例 / Tooltip 展示名 */
	name: string;
	/** 折线与 Y 轴刻度颜色 */
	color: string;
	/** `[时间戳, 数值]` */
	data: [number, number][];
	/** Y 轴下限 */
	min?: number;
	/** Y 轴上限 */
	max?: number;
	/** 阶梯折线 */
	step?: false | "start" | "middle" | "end";
	/** 是否平滑曲线 */
	smooth?: boolean;
}

/**
 * 与 ECharts grid / dataZoom 对齐的像素布局，供顶部窗口标签定位。
 */
export interface LineChartLayout {
	/** 绘图区左侧（Y 轴宽度） */
	left: number;
	/** 绘图区右侧留白 */
	right: number;
	/** dataZoom 右侧留白，与绘图区 right 对齐 */
	sliderRight: number;
	/** 轨道上方日期行高度 */
	dateHeight: number;
	/** dataZoom 距容器顶 */
	dataZoomTop: number;
	/** dataZoom 轨道高度 */
	dataZoomHeight: number;
}

/**
 * 组装 ECharts option 所需的尺寸与缩放。
 */
export interface LineChartBuildContext {
	/** 容器宽度（CSS 像素） */
	width: number;
	/** 容器高度（CSS 像素） */
	height: number;
	/** 相对蓝湖 1400 舞台的缩放比 */
	scale: number;
	/** dataZoom 窗口百分比，拖动过程中由组件 ref 持有以免重置 */
	zoom: {
		start: number;
		end: number;
	};
	/** 滑块 / 轨道总范围 */
	timeExtent: [number, number] | null;
	/** 图表 X 轴可见范围（与滑块窗口解耦） */
	viewExtent: [number, number] | null;
	/** Tooltip 数值格式化 */
	valueFormatter: (value: number, seriesName: string) => string;
}
