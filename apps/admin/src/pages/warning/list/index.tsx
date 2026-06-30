import { App, Button, DatePicker, Select, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import cardBlueCircleImg from "@/assets/warning/card-blue-circle.png";
import cardGreenCircleImg from "@/assets/warning/card-green-circle.png";
import statUnprocessedImg from "@/assets/warning/stat-unprocessed.png";
import statWarningCountImg from "@/assets/warning/stat-warning-count.png";
import { list, processWarning, toListParams } from "../api";
import {
	buildStatCards,
	getMockStats,
	LEVEL_COLOR,
	LEVEL_LABEL,
	STATUS_COLOR,
	STATUS_LABEL,
	STATUS_OPTIONS,
	type StatCard,
	type StatusFilter,
	TYPE_LABEL,
	type WarningItem,
	type WarningStats,
} from "../utils";
import styles from "./index.module.css";

const { RangePicker } = DatePicker;

const STAT_CARD_ASSETS = {
	totalTodayImg: statWarningCountImg,
	solvedTodayImg: statWarningCountImg,
	unsolvedTodayImg: statUnprocessedImg,
	blueCircleBg: cardBlueCircleImg,
	greenCircleBg: cardGreenCircleImg,
} as const;

const STAT_CARD_TONE_CLASS = {
	blue: styles.summaryCardBlue,
	green: styles.summaryCardGreen,
	orange: styles.summaryCardOrange,
} as const;

function StatCardView({ card }: { card: StatCard }) {
	return (
		<div
			className={`${styles.summaryCard} ${STAT_CARD_TONE_CLASS[card.tone]}`}
			style={{ backgroundImage: `url(${card.background})` }}
		>
			<div className={styles.summaryCardTitle}>{card.title}</div>
			<div className={styles.summaryCardValue}>{card.value}</div>
			<img
				className={styles.summaryCardIllustration}
				src={card.image}
				alt=""
				draggable={false}
			/>
		</div>
	);
}

const WarningList = () => {
	const { message: showMsg } = App.useApp();

	const [dateRange, setDateRange] = useState<[string, string] | null>(null);
	const [status, setStatus] = useState<StatusFilter>("all");

	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<WarningItem[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [stats, setStats] = useState<WarningStats>(getMockStats);
	const [processingId, setProcessingId] = useState<string | null>(null);

	const statCards = buildStatCards(stats, STAT_CARD_ASSETS);

	const loadData = async (
		p: number,
		ps: number,
		filterDateRange: [string, string] | null = dateRange,
		filterStatus: StatusFilter = status,
	) => {
		setLoading(true);
		try {
			const result = await list(
				toListParams(p, ps, filterDateRange, filterStatus),
			);
			setDataSource(result.list);
			setTotal(result.total);
			setPageNum(result.pageNum);
			setPageSize(result.pageSize);
			setStats(result.stats);
		} catch {
			showMsg.error("加载告警列表失败");
		} finally {
			setLoading(false);
		}
	};

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			loadData(1, pageSize);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSearch = () => {
		loadData(1, pageSize);
	};

	const handleReset = () => {
		setDateRange(null);
		setStatus("all");
		loadData(1, pageSize, null, "all");
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		const nextPage = pagination.current ?? 1;
		const nextSize = pagination.pageSize ?? pageSize;
		loadData(nextPage, nextSize);
	};

	const handleProcess = async (record: WarningItem) => {
		setProcessingId(record.id);
		try {
			await processWarning(record.id);
			showMsg.success("已标记为已解决");
			loadData(pageNum, pageSize);
		} catch {
			showMsg.error("操作失败");
		} finally {
			setProcessingId(null);
		}
	};

	const columns: ColumnsType<WarningItem> = [
		{
			title: "类型",
			dataIndex: "type",
			key: "type",
			width: 80,
			render: (type: WarningItem["type"]) => TYPE_LABEL[type],
		},
		{
			title: "名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
		},
		{
			title: "当前值",
			dataIndex: "currentValue",
			key: "currentValue",
			width: 90,
		},
		{
			title: "阈值范围",
			dataIndex: "thresholdRange",
			key: "thresholdRange",
			width: 110,
		},
		{
			title: "等级",
			dataIndex: "level",
			key: "level",
			width: 80,
			render: (level: WarningItem["level"]) => (
				<Tag color={LEVEL_COLOR[level]}>{LEVEL_LABEL[level]}</Tag>
			),
		},
		{
			title: "时间",
			dataIndex: "time",
			key: "time",
			width: 180,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 100,
			render: (itemStatus: WarningItem["status"]) => (
				<Tag color={STATUS_COLOR[itemStatus]}>
					{STATUS_LABEL[itemStatus]}
				</Tag>
			),
		},
		{
			title: "操作",
			key: "actions",
			width: 120,
			fixed: "right",
			render: (_: unknown, record: WarningItem) =>
				record.status === "unprocessed" ? (
					<Button
						type="link"
						size="small"
						loading={processingId === record.id}
						onClick={() => handleProcess(record)}
					>
						标记解决
					</Button>
				) : (
					<span className={styles.processedAction}>已处理</span>
				),
		},
	];

	return (
		<div className={styles.warning}>
			<div className={styles.topPanel}>
				<div className={styles.summaryCards}>
					{statCards.map((card) => (
						<StatCardView key={card.key} card={card} />
					))}
				</div>
			</div>

			<div className={styles.filterBar}>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>时间范围</span>
					<RangePicker
						value={
							dateRange
								? [dayjs(dateRange[0]), dayjs(dateRange[1])]
								: null
						}
						onChange={(_, dateStrings) => {
							const [start, end] = dateStrings;
							setDateRange(start && end ? [start, end] : null);
						}}
					/>
				</div>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>状态</span>
					<Select
						className={styles.filterSelect}
						value={status}
						options={STATUS_OPTIONS}
						onChange={setStatus}
					/>
				</div>
				<div className={styles.filterActions}>
					<Button type="primary" onClick={handleSearch}>
						查询
					</Button>
					<Button onClick={handleReset}>重置</Button>
				</div>
			</div>

			<div className={styles.listPanel}>
				<Table
					size="middle"
					className={styles.warningTable}
					columns={columns}
					dataSource={dataSource}
					rowKey="id"
					loading={loading}
					scroll={{ x: 1100 }}
					pagination={{
						current: pageNum,
						pageSize,
						total,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (count) => `共 ${count} 条`,
					}}
					onChange={handleTableChange}
				/>
			</div>
		</div>
	);
};

export default WarningList;
