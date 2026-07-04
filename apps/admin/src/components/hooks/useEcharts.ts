import type { EChartsOption } from "echarts";
import * as echarts from "echarts/core";
import { useEffect, useRef } from "react";

/**
 * 基于已注册的 ECharts 模块初始化图表。
 * 图表类型与组件须由调用方在模块顶层 `echarts.use([...])` 注册，便于按图表按需拆包。
 *
 * @param {EChartsOption} - ECharts 配置项。
 * @returns {React.RefObject<HTMLDivElement | null>} - 挂载图表的容器 ref。
 */
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
