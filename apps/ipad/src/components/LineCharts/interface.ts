/** Y 轴刻度配置 */
export interface LineChartYAxisConfig {
	/** 下限，默认 0；为 0 时不展示最小刻度文案，以贴合 1–N 的设计稿 */
	min?: number;
	/** 上限 */
	max: number;
	/** 刻度间隔 */
	interval?: number;
}

/**
 * 类目轴折线图入参（单系列，对齐设备控制页设计稿）。
 */
export interface LineChartsProps {
	/** X 轴类目，与 yAxisData 一一对应 */
	xAxisData: string[];
	/** 折线数值 */
	yAxisData: number[];
	/** Y 轴刻度，由业务页根据数据范围传入 */
	yAxis: LineChartYAxisConfig;
	/** 折线颜色 */
	lineColor?: string;
	/** 折线宽度（蓝湖 1400 逻辑像素） */
	lineWidth?: number;
	/** Tooltip 数值展示格式 */
	valueFormatter?: (value: number) => string;
}

/**
 * 已补齐默认值的入参，供组装 option 使用。
 */
export interface LineChartsResolvedProps extends LineChartsProps {
	lineColor: string;
	lineWidth: number;
	valueFormatter: (value: number) => string;
}

/**
 * 组装 ECharts option 所需的尺寸缩放。
 */
export interface LineChartBuildContext {
	/** 相对蓝湖 1400 舞台的缩放比 */
	scale: number;
}
