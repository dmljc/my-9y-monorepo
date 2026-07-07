import { Button, DatePicker, Spin } from "antd";
import type { Dayjs } from "dayjs";
import { lazy, type ReactNode, Suspense, useState } from "react";
import styles from "./index.module.css";
import {
	BAR_Y_AXIS,
	buildChartData,
	type FilterState,
	getDefaultFilter,
} from "./utils";

const BarChart = lazy(() => import("@/components/BarChart"));
const PieChart = lazy(() => import("@/components/PieChart"));

const { RangePicker } = DatePicker;

interface ChartCardProps {
	title: string;
	className?: string;
	children: ReactNode;
}

const ChartCard = ({ title, className, children }: ChartCardProps) => (
	<div className={`${styles.chartCard} ${className ?? ""}`}>
		<div className={styles.chartTitle}>{title}</div>
		<div className={styles.chartBody}>
			<Suspense
				fallback={
					<div className={styles.chartFallback}>
						<Spin />
					</div>
				}
			>
				{children}
			</Suspense>
		</div>
	</div>
);

const Statistics = () => {
	const [draftFilter, setDraftFilter] =
		useState<FilterState>(getDefaultFilter);
	const [appliedFilter, setAppliedFilter] =
		useState<FilterState>(getDefaultFilter);

	const { barAxisData, riskPieData, statusPieData } =
		buildChartData(appliedFilter);

	const handleSearch = () => setAppliedFilter({ ...draftFilter });

	const handleReset = () => {
		const next = getDefaultFilter();
		setDraftFilter(next);
		setAppliedFilter(next);
	};

	return (
		<div className={styles.statistics}>
			<div className={styles.filterBar}>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>时间选择</span>
					<RangePicker
						className={styles.filterPicker}
						value={draftFilter.timeRange}
						format="YYYY-MM-DD"
						allowClear
						onChange={(dates) =>
							setDraftFilter((prev) => ({
								...prev,
								timeRange: dates as [Dayjs, Dayjs] | null,
							}))
						}
					/>
				</div>
				<Button type="primary" onClick={handleSearch}>
					查询
				</Button>
				<Button onClick={handleReset}>重置</Button>
			</div>

			<div className={styles.chartGrid}>
				<ChartCard
					title="厂房总报警次数"
					className={styles.chartCardLarge}
				>
					<BarChart
						xAxisData={barAxisData.xAxisData}
						yAxisData={barAxisData.yAxisData}
						yAxis={BAR_Y_AXIS}
					/>
				</ChartCard>

				<div className={styles.bottomCharts}>
					<ChartCard title="高中低危报警饼状图">
						<PieChart data={riskPieData} />
					</ChartCard>

					<ChartCard title="总报警次数趋势">
						<PieChart data={statusPieData} />
					</ChartCard>
				</div>
			</div>
		</div>
	);
};

export default Statistics;
