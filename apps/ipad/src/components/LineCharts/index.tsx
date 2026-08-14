import { LineChart as LineChartSeries } from "echarts/charts";
import {
	AxisPointerComponent,
	GridComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEchartsInit } from "../hooks/useEchartsInit";
import type { LineChartsProps, LineChartsResolvedProps } from "./interface";
import styles from "./index.module.css";
import { buildLineChartOption, getStageScale } from "./utils";

echarts.use([
	LineChartSeries,
	GridComponent,
	TooltipComponent,
	AxisPointerComponent,
	CanvasRenderer,
]);

const DEFAULT_LINE_COLOR = "#1890ff";
const DEFAULT_LINE_WIDTH = 2;
const defaultValueFormatter = (value: number) => String(value);

/** 合并默认值，保证 buildLineChartOption 入参完整 */
function resolveProps(props: LineChartsProps): LineChartsResolvedProps {
	return {
		...props,
		lineColor: props.lineColor ?? DEFAULT_LINE_COLOR,
		lineWidth: props.lineWidth ?? DEFAULT_LINE_WIDTH,
		valueFormatter: props.valueFormatter ?? defaultValueFormatter,
	};
}

/**
 * 单系列类目轴折线图：浅灰网格、底部基线、无图例 / 缩放条，对齐设备控制页设计稿。
 */
const LineCharts = (props: LineChartsProps) => {
	const wrapRef = useRef<HTMLDivElement | null>(null);
	const [scale, setScale] = useState(1);
	const {
		xAxisData,
		yAxisData,
		yAxis,
		lineColor = DEFAULT_LINE_COLOR,
		lineWidth = DEFAULT_LINE_WIDTH,
		valueFormatter = defaultValueFormatter,
	} = props;

	const option = useMemo(
		() =>
			buildLineChartOption(
				resolveProps({
					xAxisData,
					yAxisData,
					yAxis,
					lineColor,
					lineWidth,
					valueFormatter,
				}),
				{ scale },
			),
		[
			xAxisData,
			yAxisData,
			yAxis.min,
			yAxis.max,
			yAxis.interval,
			lineColor,
			lineWidth,
			valueFormatter,
			scale,
		],
	);

	const chartRef = useEchartsInit(option);

	useEffect(() => {
		const el = wrapRef.current;
		if (!el) {
			return;
		}

		const update = () => {
			setScale(getStageScale(el));
		};

		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div ref={wrapRef} className={styles.container}>
			<div ref={chartRef} className={styles.chart} />
		</div>
	);
};

export type { LineChartYAxisConfig, LineChartsProps } from "./interface";
export default LineCharts;
