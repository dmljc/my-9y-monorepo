import { LineChart as LineChartSeries } from "echarts/charts";
import {
	AxisPointerComponent,
	DataZoomComponent,
	GridComponent,
	MarkLineComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEchartsInit } from "../hooks/useEchartsInit";
import styles from "./index.module.css";
import type { LineChartsProps } from "./interface";
import {
	buildLineChartOption,
	computeDefaultZoom,
	computeViewExtent,
	DEFAULT_PAGE_SIZE,
	formatRangeDate,
	formatRangeDuration,
	getLineChartLayout,
	getStageScale,
	getTimeExtent,
	padTimeExtent,
	pageViewExtent,
	resolveSeries,
	stepZoomWindowDays,
} from "./utils";

echarts.use([
	LineChartSeries,
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
	AxisPointerComponent,
	MarkLineComponent,
	CanvasRenderer,
]);

const SLIDER_RANGE_MS = 24 * 60 * 60 * 1000;
const AXIS_RANGE_MS = 5 * 60 * 1000;
const TOTAL_RANGE_DAYS = 7;
const defaultValueFormatter = (value: number) => String(value);

/**
 * dataZoom 轨道上的起止日期、窗口时长与当前百分比。
 */
interface SliderChrome {
	startDate: string;
	endDate: string;
	startPct: number;
	endPct: number;
	badgeLeft: number;
	badgeWidth: number;
	badgeLabel: string;
	showBadge: boolean;
}

const PlusIcon = () => (
	<svg className={styles.zoomIcon} viewBox="0 0 12 12" aria-hidden>
		<title>放大</title>
		<path
			d="M6 2v8M2 6h8"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
		/>
	</svg>
);

const MinusIcon = () => (
	<svg className={styles.zoomIcon} viewBox="0 0 12 12" aria-hidden>
		<title>缩小</title>
		<path
			d="M2 6h8"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
		/>
	</svg>
);

const ChevronLeftIcon = () => (
	<svg className={styles.sideIcon} viewBox="0 0 16 16" aria-hidden>
		<title>上一页</title>
		<path
			d="M10 3 5 8l5 5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const ChevronRightIcon = () => (
	<svg className={styles.sideIcon} viewBox="0 0 16 16" aria-hidden>
		<title>下一页</title>
		<path
			d="M6 3l5 5-5 5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * 左侧多条独立 Y 轴的时序折线图：顶部 dataZoom、+/- 缩放、时间轴翻页、自定义 Tooltip。
 */
const LineCharts = ({
	series,
	defaultRangeMs = SLIDER_RANGE_MS,
	axisRangeMs = AXIS_RANGE_MS,
	totalRangeDays = TOTAL_RANGE_DAYS,
	pageSize = DEFAULT_PAGE_SIZE,
	valueFormatter = defaultValueFormatter,
	onTimePage,
	onRangeChange,
}: LineChartsProps) => {
	const wrapRef = useRef<HTMLDivElement | null>(null);
	const zoomRef = useRef({ start: 0, end: 100 });
	const extentKeyRef = useRef("");
	const emptyEndRef = useRef(0);
	const sliderWindowRef = useRef<[number, number] | null>(null);
	const viewLockedRef = useRef(false);
	const sliderDirtyRef = useRef(false);
	const lastEmittedRangeRef = useRef<{ from: number; to: number } | null>(
		null,
	);
	const onRangeChangeRef = useRef(onRangeChange);
	onRangeChangeRef.current = onRangeChange;
	const [box, setBox] = useState({ width: 0, height: 0, scale: 1 });
	const [chrome, setChrome] = useState<SliderChrome | null>(null);
	const [viewExtent, setViewExtent] = useState<[number, number] | null>(null);
	const [nowMs, setNowMs] = useState(() => Date.now());

	const resolved = useMemo(() => resolveSeries(series), [series]);
	const timeExtent = useMemo(() => {
		const dataExtent = getTimeExtent(resolved);
		if (!dataExtent && !emptyEndRef.current) {
			emptyEndRef.current = Date.now();
		}
		if (dataExtent) {
			emptyEndRef.current = 0;
		}
		return padTimeExtent(
			dataExtent,
			totalRangeDays,
			emptyEndRef.current || Date.now(),
		);
	}, [resolved, totalRangeDays]);
	const layout = useMemo(() => getLineChartLayout(box.scale), [box.scale]);
	const visibleSeries = useMemo(
		() => resolved.slice(0, pageSize),
		[resolved, pageSize],
	);
	const extentKey = `${timeExtent[0]}_${timeExtent[1]}_${defaultRangeMs}_${axisRangeMs}_${totalRangeDays}`;

	if (extentKeyRef.current !== extentKey) {
		extentKeyRef.current = extentKey;
		zoomRef.current = computeDefaultZoom(timeExtent, defaultRangeMs);
		sliderWindowRef.current = null;
		viewLockedRef.current = false;
		sliderDirtyRef.current = false;
		lastEmittedRangeRef.current = null;
	}

	const chartViewExtent = useMemo(() => {
		const maxEnd = Math.min(timeExtent[1], nowMs);
		const raw =
			viewExtent ?? computeViewExtent(timeExtent[1], axisRangeMs, nowMs);
		if (raw[1] <= maxEnd) {
			return raw;
		}
		return computeViewExtent(maxEnd, axisRangeMs, nowMs);
	}, [viewExtent, timeExtent, axisRangeMs, nowMs]);

	const option = useMemo(
		() =>
			box.width < 8 || box.height < 8
				? {}
				: buildLineChartOption(visibleSeries, {
						width: box.width,
						height: box.height,
						scale: box.scale,
						zoom: zoomRef.current,
						timeExtent,
						viewExtent: chartViewExtent,
						valueFormatter,
					}),
		[
			visibleSeries,
			box.width,
			box.height,
			box.scale,
			extentKey,
			chartViewExtent,
			valueFormatter,
		],
	);

	const chartRef = useEchartsInit(option);

	useEffect(() => {
		const timer = window.setInterval(() => {
			setNowMs(Date.now());
		}, 1000);
		return () => {
			window.clearInterval(timer);
		};
	}, []);

	useEffect(() => {
		if (viewLockedRef.current) {
			return;
		}
		const span = timeExtent[1] - timeExtent[0];
		const zoom = zoomRef.current;
		const slider: [number, number] = [
			timeExtent[0] + (span * zoom.start) / 100,
			timeExtent[0] + (span * zoom.end) / 100,
		];
		sliderWindowRef.current = slider;
		setViewExtent(computeViewExtent(slider[1], axisRangeMs, Date.now()));
	}, [extentKey]);

	useEffect(() => {
		const el = wrapRef.current;
		if (!el) {
			return;
		}

		const update = () => {
			setBox({
				width: el.clientWidth,
				height: el.clientHeight,
				scale: getStageScale(el),
			});
		};

		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => {
			observer.disconnect();
		};
	}, []);

	const emitSliderRange = (from: number, to: number) => {
		const next = { from: Math.round(from), to: Math.round(to) };
		if (
			!Number.isFinite(next.from) ||
			!Number.isFinite(next.to) ||
			next.from >= next.to
		) {
			return;
		}
		const prev = lastEmittedRangeRef.current;
		if (prev && prev.from === next.from && prev.to === next.to) {
			return;
		}
		lastEmittedRangeRef.current = next;
		onRangeChangeRef.current?.(next);
	};

	useEffect(() => {
		const el = chartRef.current;
		if (!el || box.width < 8) {
			return;
		}

		const chart = echarts.getInstanceByDom(el);
		if (!chart || chart.isDisposed()) {
			return;
		}

		let cancelled = false;
		const syncChrome = (fromUserZoom: boolean) => {
			if (cancelled || chart.isDisposed()) {
				return;
			}
			if (!timeExtent) {
				setChrome(null);
				return;
			}

			const raw = chart.getOption() as {
				dataZoom?: Array<{
					start?: number;
					end?: number;
					startValue?: number | string;
					endValue?: number | string;
				}>;
			};
			const slider = raw.dataZoom?.[0];
			if (!slider) {
				setChrome(null);
				return;
			}

			const startPct = Number(slider.start ?? 0);
			const endPct = Number(slider.end ?? 100);
			const zoomChanged =
				Math.abs(startPct - zoomRef.current.start) > 0.15 ||
				Math.abs(endPct - zoomRef.current.end) > 0.15;
			zoomRef.current = { start: startPct, end: endPct };
			const span = timeExtent[1] - timeExtent[0];
			const parsedStart = Number(slider.startValue);
			const parsedEnd = Number(slider.endValue);
			const startMs = Number.isFinite(parsedStart)
				? parsedStart
				: timeExtent[0] + (span * startPct) / 100;
			const endMs = Number.isFinite(parsedEnd)
				? parsedEnd
				: timeExtent[0] + (span * endPct) / 100;
			const track = Math.max(
				box.width - layout.left - layout.sliderRight,
				0,
			);
			const badgeLeft = layout.left + (track * startPct) / 100;
			const badgeWidth = (track * (endPct - startPct)) / 100;
			sliderWindowRef.current = [startMs, endMs];
			if (fromUserZoom && zoomChanged && !viewLockedRef.current) {
				sliderDirtyRef.current = true;
				const nextView = computeViewExtent(endMs, axisRangeMs, Date.now());
				setViewExtent((prev) =>
					prev && prev[0] === nextView[0] && prev[1] === nextView[1]
						? prev
						: nextView,
				);
			}
			setChrome({
				startDate: formatRangeDate(timeExtent[0]),
				endDate: formatRangeDate(timeExtent[1]),
				startPct,
				endPct,
				badgeLeft,
				badgeWidth,
				badgeLabel: formatRangeDuration(startMs, endMs),
				showBadge: badgeWidth > 36 * box.scale,
			});
		};

		const onDataZoom = () => {
			syncChrome(true);
		};
		const flushSliderRange = () => {
			requestAnimationFrame(() => {
				if (
					cancelled ||
					viewLockedRef.current ||
					!sliderDirtyRef.current
				) {
					return;
				}
				sliderDirtyRef.current = false;
				const range = sliderWindowRef.current;
				if (!range) {
					return;
				}
				emitSliderRange(range[0], range[1]);
			});
		};
		chart.on("dataZoom", onDataZoom);
		const wrapEl = wrapRef.current;
		wrapEl?.addEventListener("pointerup", flushSliderRange, true);
		wrapEl?.addEventListener("pointercancel", flushSliderRange, true);
		wrapEl?.addEventListener("touchend", flushSliderRange, true);
		const rafId = requestAnimationFrame(() => {
			syncChrome(false);
		});
		return () => {
			cancelled = true;
			cancelAnimationFrame(rafId);
			wrapEl?.removeEventListener("pointerup", flushSliderRange, true);
			wrapEl?.removeEventListener("pointercancel", flushSliderRange, true);
			wrapEl?.removeEventListener("touchend", flushSliderRange, true);
			if (!chart.isDisposed()) {
				chart.off("dataZoom", onDataZoom);
			}
		};
	}, [
		option,
		box.width,
		box.scale,
		layout.left,
		layout.sliderRight,
		timeExtent,
		axisRangeMs,
	]);

	const applyZoom = (deltaDays: number) => {
		const el = chartRef.current;
		if (!el) {
			return;
		}
		const chart = echarts.getInstanceByDom(el);
		if (!chart || chart.isDisposed()) {
			return;
		}
		const next = stepZoomWindowDays(zoomRef.current, timeExtent, deltaDays);
		zoomRef.current = { start: next.start, end: next.end };
		viewLockedRef.current = false;
		sliderWindowRef.current = [next.from, next.to];
		sliderDirtyRef.current = false;
		setViewExtent(computeViewExtent(next.to, axisRangeMs, Date.now()));
		emitSliderRange(next.from, next.to);
		chart.dispatchAction({
			type: "dataZoom",
			batch: [
				{ dataZoomIndex: 0, start: next.start, end: next.end },
				{ dataZoomIndex: 1, start: next.start, end: next.end },
			],
		});
		requestAnimationFrame(() => {
			sliderDirtyRef.current = false;
		});
	};

	const applyTimePage = (direction: -1 | 1) => {
		const now = Date.now();
		const nextView = pageViewExtent(
			chartViewExtent,
			direction,
			axisRangeMs,
			timeExtent,
			now,
		);
		if (
			nextView[0] === chartViewExtent[0] &&
			nextView[1] === chartViewExtent[1]
		) {
			return;
		}
		if (direction > 0 && nextView[1] > now) {
			return;
		}
		viewLockedRef.current = true;
		setViewExtent(nextView);
		onTimePage?.({ from: nextView[0], to: nextView[1] });
	};

	const sliderSpanMs = chrome
		? ((chrome.endPct - chrome.startPct) / 100) *
			(timeExtent[1] - timeExtent[0])
		: SLIDER_RANGE_MS;
	const sliderDays = Math.max(1, Math.round(sliderSpanMs / SLIDER_RANGE_MS));
	const canZoomIn = sliderDays > 1;
	const canZoomOut = sliderDays < totalRangeDays;
	const canPagePrev = chartViewExtent[0] - axisRangeMs >= timeExtent[0];
	const canPageNext =
		pageViewExtent(chartViewExtent, 1, axisRangeMs, timeExtent, nowMs)[1] >
		chartViewExtent[1];
	const sideTop =
		layout.dataZoomTop +
		layout.dataZoomHeight +
		(box.height - layout.dataZoomTop - layout.dataZoomHeight) / 2;

	return (
		<div ref={wrapRef} className={styles.container}>
			<div ref={chartRef} className={styles.chart} />
			{chrome ? (
				<>
					<span
						className={styles.rangeStart}
						style={{
							top: 0,
							left: layout.left,
							height: layout.dateHeight,
						}}
					>
						{chrome.startDate}
					</span>
					<span
						className={styles.rangeEnd}
						style={{
							top: 0,
							right: layout.sliderRight,
							height: layout.dateHeight,
						}}
					>
						{chrome.endDate}
					</span>
					{chrome.showBadge ? (
						<span
							className={styles.rangeBadge}
							style={{
								top: layout.dataZoomTop,
								left: chrome.badgeLeft,
								width: chrome.badgeWidth,
								height: layout.dataZoomHeight,
							}}
						>
							{chrome.badgeLabel}
						</span>
					) : null}
				</>
			) : null}
			<div
				className={styles.zoomGroup}
				style={{
					top: layout.dataZoomTop,
					right: layout.right,
					height: layout.dataZoomHeight,
					gap: layout.zoomBtnGap,
				}}
			>
				<button
					type="button"
					className={styles.zoomBtn}
					style={{
						width: layout.zoomBtnSize,
						height: layout.zoomBtnSize,
						borderRadius: 4 * box.scale,
					}}
					disabled={!canZoomIn}
					aria-label="放大"
					onClick={() => {
						applyZoom(-1);
					}}
				>
					<PlusIcon />
				</button>
				<button
					type="button"
					className={styles.zoomBtn}
					style={{
						width: layout.zoomBtnSize,
						height: layout.zoomBtnSize,
						borderRadius: 4 * box.scale,
					}}
					disabled={!canZoomOut}
					aria-label="缩小"
					onClick={() => {
						applyZoom(1);
					}}
				>
					<MinusIcon />
				</button>
			</div>
			<button
				type="button"
				className={`${styles.sideBtn} ${styles.sidePrev}`}
				style={{
					top: sideTop,
					width: 36 * box.scale,
					height: 36 * box.scale,
					transform: "translateY(-50%)",
				}}
				disabled={!canPagePrev}
				aria-label="上一页"
				onClick={() => {
					applyTimePage(-1);
				}}
			>
				<ChevronLeftIcon />
			</button>
			<button
				type="button"
				className={`${styles.sideBtn} ${styles.sideNext}`}
				style={{
					top: sideTop,
					width: 36 * box.scale,
					height: 36 * box.scale,
					transform: "translateY(-50%)",
				}}
				disabled={!canPageNext}
				aria-label="下一页"
				onClick={() => {
					applyTimePage(1);
				}}
			>
				<ChevronRightIcon />
			</button>
		</div>
	);
};

export type {
	LineChartPoint,
	LineChartSeriesItem,
	LineChartsProps,
} from "./interface";
export default LineCharts;
