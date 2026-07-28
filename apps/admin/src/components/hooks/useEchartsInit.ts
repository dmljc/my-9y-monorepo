import type { EChartsOption } from "echarts";
import * as echarts from "echarts/core";
import { useEffect, useRef } from "react";

/**
 * 基于已注册的 ECharts 模块初始化图表。
 * 图表类型与组件须由调用方在模块顶层 `echarts.use([...])` 注册，便于按图表按需拆包。
 *
 * 生命周期：
 * - 挂载时 `init` 一次，卸载时 `dispose`
 * - `option` 变化时仅 `setOption` 增量更新，避免父组件重渲染导致整表销毁重建
 *
 * @param {EChartsOption} - ECharts 配置项。
 * @returns {React.RefObject<HTMLDivElement | null>} - 挂载图表的容器 ref。
 */
export function useEchartsInit(option: EChartsOption) {
	const chartRef = useRef<HTMLDivElement | null>(null);
	const instanceRef = useRef<echarts.EChartsType | null>(null);

	useEffect(() => {
		const chartEl = chartRef.current;
		if (!chartEl) {
			return;
		}

		const chart = echarts.init(chartEl);
		instanceRef.current = chart;

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
			instanceRef.current = null;
		};
	}, []);

	useEffect(() => {
		const chart = instanceRef.current;
		if (!chart) {
			return;
		}
		// 传入完整 option，notMerge 避免残留旧 series / 轴配置
		chart.setOption(option, { notMerge: true });
	}, [option]);

	return chartRef;
}
