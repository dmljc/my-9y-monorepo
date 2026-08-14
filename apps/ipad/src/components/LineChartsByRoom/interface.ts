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
	/** 初始可见窗口天数，默认 7 */
	defaultRangeDays?: number;
	/** 一屏展示的独立 Y 轴条数，超出后左右翻页，默认 3 */
	pageSize?: number;
	/** Tooltip「原始值」格式化 */
	valueFormatter?: (value: number, seriesName: string) => string;
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
 * 与 ECharts grid / dataZoom 对齐的像素布局，供顶部窗口标签与按钮定位。
 */
export interface LineChartLayout {
	/** 绘图区左侧（Y 轴宽度） */
	left: number;
	/** 绘图区右侧留白 */
	right: number;
	/** dataZoom 右侧留白（为 +/- 按钮预留） */
	sliderRight: number;
	/** 轨道上方日期行高度 */
	dateHeight: number;
	/** dataZoom 距容器顶 */
	dataZoomTop: number;
	/** dataZoom 轨道高度 */
	dataZoomHeight: number;
	/** +/- 按钮边长 */
	zoomBtnSize: number;
	/** +/- 按钮间距 */
	zoomBtnGap: number;
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
	/** Tooltip 数值格式化 */
	valueFormatter: (value: number, seriesName: string) => string;
}
