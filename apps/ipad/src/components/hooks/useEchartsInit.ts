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
 * - `setOption` 期间不 `resize`，避免 ECharts 主流程中读到已销毁的 `__ec_inner_*`
 *
 * @param {EChartsOption} - ECharts 配置项。
 * @returns {React.RefObject<HTMLDivElement | null>} - 挂载图表的容器 ref。
 */
export function useEchartsInit(option: EChartsOption) {
	const chartRef = useRef<HTMLDivElement | null>(null);
	const instanceRef = useRef<echarts.EChartsType | null>(null);
	const optionRef = useRef(option);
	const applyingRef = useRef(false);
	optionRef.current = option;

	useEffect(() => {
		const chartEl = chartRef.current;
		if (!chartEl) {
			return;
		}

		const chart = echarts.init(chartEl);
		instanceRef.current = chart;
		let alive = true;
		let resizeRaf = 0;

		const resize = () => {
			if (!alive || applyingRef.current || chart.isDisposed()) {
				return;
			}
			try {
				chart.resize();
			} catch {
				// 销毁或 setOption 主流程中 resize 可能抛 __ec_inner_*
			}
		};

		const scheduleResize = () => {
			if (resizeRaf) {
				cancelAnimationFrame(resizeRaf);
			}
			resizeRaf = requestAnimationFrame(() => {
				resizeRaf = 0;
				resize();
			});
		};

		const applyOption = (next: EChartsOption) => {
			if (!alive || chart.isDisposed()) {
				return;
			}
			applyingRef.current = true;
			try {
				chart.setOption(next, { notMerge: true });
			} catch {
				// 实例正在销毁或内部视图未就绪
			} finally {
				applyingRef.current = false;
			}
		};

		if (Object.keys(optionRef.current).length > 0) {
			applyOption(optionRef.current);
		}

		const resizeObserver = new ResizeObserver(scheduleResize);
		resizeObserver.observe(chartEl);
		const parentEl = chartEl.parentElement;
		if (parentEl) {
			resizeObserver.observe(parentEl);
		}

		return () => {
			alive = false;
			applyingRef.current = false;
			if (resizeRaf) {
				cancelAnimationFrame(resizeRaf);
			}
			resizeObserver.disconnect();
			instanceRef.current = null;
			if (!chart.isDisposed()) {
				try {
					chart.dispose();
				} catch {
					// ignore
				}
			}
		};
	}, []);

	useEffect(() => {
		const chart = instanceRef.current;
		if (!chart || chart.isDisposed()) {
			return;
		}
		if (Object.keys(option).length === 0) {
			return;
		}
		applyingRef.current = true;
		try {
			chart.setOption(option, { notMerge: true });
		} catch {
			// ECharts 偶发 __ec_inner_*：销毁中或与 resize 重叠
		} finally {
			applyingRef.current = false;
		}
	}, [option]);

	return chartRef;
}
