import { Button, DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import type { ReactNode } from "react";
import { useState } from "react";
import { BarChart, PieChart } from "@/components";
import styles from "./index.module.css";
import {
	BAR_Y_AXIS,
	buildChartData,
	DEFAULT_FILTER,
	type FilterState,
} from "./utils";

const { RangePicker } = DatePicker;

interface ChartCardProps {
	title: string;
	className?: string;
	children: ReactNode;
}

// 图表卡片组件
const ChartCard = ({ title, className, children }: ChartCardProps) => (
	<div className={`${styles.chartCard} ${className ?? ""}`}>
		<header className={styles.chartHeader}>
			<div className={styles.chartTitle}>{title}</div>
		</header>
		<div className={styles.chartBody}>{children}</div>
	</div>
);

// 统计页面组件
const Statistics = () => {
	// draftFilter：表单编辑态；appliedFilter：点击「查询」后生效的筛选条件
	const [draftFilter, setDraftFilter] = useState<FilterState>(DEFAULT_FILTER);
	const [appliedFilter, setAppliedFilter] =
		useState<FilterState>(DEFAULT_FILTER);

	const { barAxisData, riskPieData, statusPieData } =
		buildChartData(appliedFilter);

	const handleSearch = () => setAppliedFilter({ ...draftFilter });

	const handleReset = () => {
		setDraftFilter(DEFAULT_FILTER);
		setAppliedFilter(DEFAULT_FILTER);
	};

	return (
		<div className={styles.statistics}>
			<section className={styles.filterBar}>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>时间选择</span>
					<RangePicker
						className={styles.filterPicker}
						value={draftFilter.timeRange}
						format="YYYY-MM-DD"
						allowClear
						onChange={(dates) =>
							setDraftFilter({
								timeRange: dates as [Dayjs, Dayjs] | null,
							})
						}
					/>
				</div>
				<Button type="primary" onClick={handleSearch}>
					查询
				</Button>
				<Button onClick={handleReset}>重置</Button>
			</section>

			<section className={styles.chartGrid}>
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
			</section>
		</div>
	);
};

export default Statistics;
