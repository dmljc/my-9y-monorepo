import { LineChart as LineChartSeries } from "echarts/charts";
import {
	AxisPointerComponent,
	DataZoomComponent,
	GridComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
	type PointerEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useEchartsInit } from "../hooks/useEchartsInit";
import {
	computeDefaultZoom,
	computeViewExtent,
	formatRangeDate,
	formatRangeDuration,
	getLineChartLayout,
	getStageScale,
	padTimeExtent,
	pageViewExtent,
	snapZoomWindowDays,
} from "../LineChartsByRoom/utils";
import styles from "./index.module.css";
import type { LineChartsProps } from "./interface";
import { buildLineChartOption, getPointsExtent, resolveSeries } from "./utils";

echarts.use([
	LineChartSeries,
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
	AxisPointerComponent,
	CanvasRenderer,
]);

const SLIDER_RANGE_MS = 24 * 60 * 60 * 1000;
const AXIS_RANGE_MS = 60 * 60 * 1000;
const TOTAL_RANGE_DAYS = 7;
const DEFAULT_LINE_WIDTH = 2;
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
 * 多系列同轴时序折线图：X 轴与 LineChartsByRoom 相同（时间轴、滑块、翻页）。
 */
const LineCharts = ({
	series = [],
	lineWidth = DEFAULT_LINE_WIDTH,
	axisRangeMs = AXIS_RANGE_MS,
	totalRangeDays = TOTAL_RANGE_DAYS,
	valueFormatter = defaultValueFormatter,
	unit = "",
	onTimePage,
	onRangeChange,
}: LineChartsProps) => {
	const wrapRef = useRef<HTMLDivElement | null>(null);
	const zoomRef = useRef({ start: 0, end: 100 });
	const extentKeyRef = useRef("");
	const emptyEndRef = useRef(0);
	const sliderWindowRef = useRef<[number, number] | null>(null);
	const chartPanStartXRef = useRef<number | null>(null);
	const viewLockedRef = useRef(false);
	const sliderDirtyRef = useRef(false);
	const snappingRef = useRef(false);
	const lastEmittedRangeRef = useRef<{ from: number; to: number } | null>(
		null,
	);
	const onRangeChangeRef = useRef(onRangeChange);
	onRangeChangeRef.current = onRangeChange;
	const [box, setBox] = useState({ width: 0, height: 0, scale: 1 });
	const [chrome, setChrome] = useState<SliderChrome | null>(null);
	const [viewExtent, setViewExtent] = useState<[number, number] | null>(null);

	const resolved = useMemo(() => resolveSeries(series), [series]);
	const points = useMemo(
		() => resolved.flatMap((item) => item.data),
		[resolved],
	);
	const timeExtent = useMemo(() => {
		const dataExtent = getPointsExtent(points);
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
	}, [points, totalRangeDays]);
	const layout = useMemo(() => getLineChartLayout(box.scale), [box.scale]);
	const extentKey = `${timeExtent[0]}_${timeExtent[1]}_${axisRangeMs}_${totalRangeDays}`;

	if (extentKeyRef.current !== extentKey) {
		extentKeyRef.current = extentKey;
		zoomRef.current = computeDefaultZoom(timeExtent, SLIDER_RANGE_MS);
		sliderWindowRef.current = null;
		viewLockedRef.current = false;
		sliderDirtyRef.current = false;
		lastEmittedRangeRef.current = null;
	}

	const chartViewExtent = useMemo(() => {
		const now = Date.now();
		const maxEnd = Math.min(timeExtent[1], now);
		const raw =
			viewExtent ?? computeViewExtent(timeExtent[1], axisRangeMs, now);
		if (raw[1] <= maxEnd) {
			return raw;
		}
		return computeViewExtent(maxEnd, axisRangeMs, now);
	}, [viewExtent, timeExtent, axisRangeMs]);

	const option = useMemo(
		() =>
			box.width < 8 || box.height < 8
				? {}
				: buildLineChartOption(resolved, lineWidth, valueFormatter, {
						width: box.width,
						height: box.height,
						scale: box.scale,
						zoom: zoomRef.current,
						timeExtent,
						viewExtent: chartViewExtent,
						unit,
					}),
		[
			resolved,
			lineWidth,
			valueFormatter,
			unit,
			box.width,
			box.height,
			box.scale,
			extentKey,
			chartViewExtent,
		],
	);

	const chartRef = useEchartsInit(option);

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
			if (fromUserZoom && zoomChanged && !snappingRef.current) {
				viewLockedRef.current = false;
				sliderDirtyRef.current = true;
			}
			snappingRef.current = false;
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
				if (cancelled || !sliderDirtyRef.current) {
					return;
				}
				sliderDirtyRef.current = false;
				const range = sliderWindowRef.current;
				if (!range) {
					return;
				}
				const next = snapZoomWindowDays(range[0], range[1], timeExtent);
				zoomRef.current = { start: next.start, end: next.end };
				sliderWindowRef.current = [next.from, next.to];
				viewLockedRef.current = false;
				setViewExtent(
					computeViewExtent(next.to, axisRangeMs, Date.now()),
				);
				emitSliderRange(next.from, next.to);
				if (
					Math.abs(next.from - range[0]) > 1 ||
					Math.abs(next.to - range[1]) > 1
				) {
					snappingRef.current = true;
					chart.dispatchAction({
						type: "dataZoom",
						batch: [
							{
								dataZoomIndex: 0,
								start: next.start,
								end: next.end,
							},
							{
								dataZoomIndex: 1,
								start: next.start,
								end: next.end,
							},
						],
					});
				}
			});
		};
		chart.on("dataZoom", onDataZoom);
		window.addEventListener("pointerup", flushSliderRange, true);
		window.addEventListener("pointercancel", flushSliderRange, true);
		window.addEventListener("touchend", flushSliderRange, true);
		const rafId = requestAnimationFrame(() => {
			syncChrome(false);
		});
		return () => {
			cancelled = true;
			cancelAnimationFrame(rafId);
			window.removeEventListener("pointerup", flushSliderRange, true);
			window.removeEventListener("pointercancel", flushSliderRange, true);
			window.removeEventListener("touchend", flushSliderRange, true);
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

	const sliderSpan = timeExtent[1] - timeExtent[0];
	const sliderStartMs =
		timeExtent[0] +
		((chrome?.startPct ?? zoomRef.current.start) / 100) * sliderSpan;
	const sliderEndMs =
		timeExtent[0] +
		((chrome?.endPct ?? zoomRef.current.end) / 100) * sliderSpan;
	const sliderBounds: [number, number] = [sliderStartMs, sliderEndMs];

	const applyTimePage = (direction: -1 | 1) => {
		const now = Date.now();
		const nextView = pageViewExtent(
			chartViewExtent,
			direction,
			axisRangeMs,
			sliderBounds,
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

	const handleChartPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		const sliderBottom =
			layout.dataZoomTop + layout.dataZoomHeight;
		if (event.button !== 0 || event.nativeEvent.offsetY <= sliderBottom) {
			return;
		}
		chartPanStartXRef.current = event.clientX;
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handleChartPointerUp = (event: PointerEvent<HTMLDivElement>) => {
		const startX = chartPanStartXRef.current;
		chartPanStartXRef.current = null;
		if (startX === null) return;

		const distance = event.clientX - startX;
		const threshold = 32 * box.scale;
		if (Math.abs(distance) < threshold) return;
		applyTimePage(distance > 0 ? -1 : 1);
	};

	const canPagePrev = chartViewExtent[0] - sliderStartMs >= axisRangeMs;
	const canPageNext =
		pageViewExtent(
			chartViewExtent,
			1,
			axisRangeMs,
			sliderBounds,
			Date.now(),
		)[1] > chartViewExtent[1];
	const sideTop =
		layout.dataZoomTop +
		layout.dataZoomHeight +
		(box.height - layout.dataZoomTop - layout.dataZoomHeight) / 2;

	return (
		<div ref={wrapRef} className={styles.container}>
			<div
				ref={chartRef}
				className={styles.chart}
				onPointerDown={handleChartPointerDown}
				onPointerUp={handleChartPointerUp}
			/>
			{box.width > 0 && totalRangeDays > 1 ? (
				<div
					className={styles.sliderTicks}
					style={{
						top: layout.dataZoomTop,
						left: layout.left,
						right: layout.sliderRight,
						height: layout.dataZoomHeight,
					}}
				>
					{Array.from(
						{ length: totalRangeDays - 1 },
						(_, index) => (
							<span
								key={index}
								className={styles.sliderTick}
								style={{
									left: `${((index + 1) / totalRangeDays) * 100}%`,
								}}
							/>
						),
					)}
				</div>
			) : null}
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
