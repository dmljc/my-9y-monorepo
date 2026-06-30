import type { EChartsOption } from "echarts";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
	GridComponent,
	LegendComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

echarts.use([
	BarChart,
	LineChart,
	PieChart,
	GridComponent,
	TooltipComponent,
	LegendComponent,
	CanvasRenderer,
]);

export function useEcharts(option: EChartsOption) {
	const chartRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const chartEl = chartRef.current;
		if (!chartEl) {
			return;
		}

		const chart = echarts.init(chartEl);
		chart.setOption(option);

		const resize = () => {
			chart.resize();
		};

		resize();
		const rafId = requestAnimationFrame(resize);

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(chartEl);

		const parentEl = chartEl.parentElement;
		if (parentEl) {
			resizeObserver.observe(parentEl);
		}

		return () => {
			cancelAnimationFrame(rafId);
			resizeObserver.disconnect();
			chart.dispose();
		};
	}, [option]);

	return chartRef;
}
