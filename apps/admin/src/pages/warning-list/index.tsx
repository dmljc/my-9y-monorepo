import { App, Button, DatePicker, Select, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import cardBlueCircleImg from "@/assets/warning/card-blue-circle.png";
import cardGreenCircleImg from "@/assets/warning/card-green-circle.png";
import cardOrangeCircleImg from "@/assets/warning/card-orange-circle.png";
import statSolvedTodayImg from "@/assets/warning/stat-solved-today.png";
import statTotalTodayImg from "@/assets/warning/stat-total-today.png";
import statUnsolvedTodayImg from "@/assets/warning/stat-unsolved-today.png";
import Access from "@/components/Access";
import { PERM_WARNING_LIST } from "@/constants/permission";
import { getStats, list, resolve } from "./api";
import styles from "./index.module.css";
import type { StatusFilter, WarningItem, WarningStats } from "./interface";
import {
	buildStatCards,
	LEVEL_COLOR,
	LEVEL_LABEL,
	STATUS_LABEL,
	STATUS_OPTIONS,
	TYPE_LABEL,
	toAlarmListQuery,
	toWarningItem,
	toWarningStats,
} from "./utils";

const { RangePicker } = DatePicker;

const STAT_CARD_ASSETS = {
	totalTodayImg: statTotalTodayImg,
	solvedTodayImg: statSolvedTodayImg,
	unsolvedTodayImg: statUnsolvedTodayImg,
	blueCircleBg: cardBlueCircleImg,
	greenCircleBg: cardGreenCircleImg,
	orangeCircleBg: cardOrangeCircleImg,
} as const;

const STAT_CARD_TONE_CLASS = {
	blue: styles.summaryCardBlue,
	green: styles.summaryCardGreen,
	orange: styles.summaryCardOrange,
} as const;

const WarningList = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();

	const [dateRange, setDateRange] = useState<[string, string] | null>(null);
	const [status, setStatus] = useState<StatusFilter>("all");

	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<WarningItem[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [stats, setStats] = useState<WarningStats>({
		totalToday: 0,
		solvedToday: 0,
		unsolvedToday: 0,
	});
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
			const data = await list(
				toAlarmListQuery(p, ps, filterDateRange, filterStatus),
			);
			const rows = data.rows ?? [];
			setDataSource(rows.map(toWarningItem));
			setTotal(data.total ?? 0);
			setPageNum(p);
			setPageSize(ps);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		const data = await getStats();
		setStats(toWarningStats(data));
	};

	const initRef = useRef(false);
	useEffect(() => {
		if (initRef.current) return;
		initRef.current = true;

		const init = async () => {
			await loadData(1, pageSize);
			await loadStats();
		};
		init();
	}, []);

	const handleSearch = () => {
		setPageNum(1);
		loadData(1, pageSize);
	};

	const handleReset = () => {
		setDateRange(null);
		setStatus("all");
		setPageNum(1);
		loadData(1, pageSize, null, "all");
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? pageSize);
	};

	const handleProcess = async (record: WarningItem) => {
		setProcessingId(record.id);
		try {
			await resolve(record.id);
			message.success("已标记为已解决");
			await loadData(pageNum, pageSize);
			await loadStats();
		} finally {
			setProcessingId(null);
		}
	};

	const handleHistoryQuery = (record: WarningItem) => {
		const warningTime = dayjs(record.time);
		if (!warningTime.isValid()) {
			message.warning("告警时间无效，无法查询历史数据");
			return;
		}
		if (!record.thingId) {
			message.warning("物实例ID为空，无法查询历史数据");
			return;
		}
		if (!record.propertyId) {
			message.warning("点位ID为空，无法查询历史数据");
			return;
		}
		const searchParams = new URLSearchParams({
			alarmTime: warningTime.format("YYYY-MM-DD HH:mm:ss"),
			thingId: record.thingId,
			propertyId: record.propertyId,
		});
		navigate(`/warning/history?${searchParams.toString()}`);
	};

	const columns: ColumnsType<WarningItem> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: WarningItem, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
		},
		{
			title: "类型",
			dataIndex: "type",
			key: "type",
			render: (type: WarningItem["type"]) => TYPE_LABEL[type],
		},
		{
			title: "当前值",
			dataIndex: "currentValue",
			key: "currentValue",
		},
		{
			title: "阈值范围",
			dataIndex: "thresholdRange",
			key: "thresholdRange",
		},
		{
			title: "等级",
			dataIndex: "level",
			key: "level",
			render: (_: WarningItem["level"], record) => (
				<Tag color={record.levelColor ?? LEVEL_COLOR[record.level]}>
					{record.levelName ?? LEVEL_LABEL[record.level]}
				</Tag>
			),
		},
		{
			title: "时间",
			dataIndex: "time",
			key: "time",
			ellipsis: true,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			render: (itemStatus: WarningItem["status"]) => (
				<span
					className={
						itemStatus === "processed"
							? styles.statusProcessed
							: styles.statusUnprocessed
					}
				>
					{STATUS_LABEL[itemStatus]}
				</span>
			),
		},
		{
			title: "操作",
			key: "actions",
			width: 250,
			fixed: "right",
			render: (_: unknown, record: WarningItem) => (
				<div className={styles.actions}>
					<Access code={PERM_WARNING_LIST.HISTORY}>
						<Button
							type="link"
							size="small"
							onClick={() => handleHistoryQuery(record)}
						>
							前后15分钟数据
						</Button>
					</Access>
					{record.status === "unprocessed" ? (
						<Access code={PERM_WARNING_LIST.RESOLVE}>
							<Button
								type="link"
								size="small"
								loading={processingId === record.id}
								onClick={() => handleProcess(record)}
							>
								标记解决
							</Button>
						</Access>
					) : (
						<span className={styles.processedAction}>已处理</span>
					)}
				</div>
			),
		},
	];

	return (
		<div className={styles.warningList}>
			<div className={styles.topPanel}>
				<div className={styles.summaryCards}>
					{statCards.map((card) => (
						<div
							key={card.key}
							className={`${styles.summaryCard} ${STAT_CARD_TONE_CLASS[card.tone]}`}
						>
							<img
								className={styles.summaryCardBg}
								src={card.background}
								alt=""
								aria-hidden
								draggable={false}
							/>
							<div className={styles.summaryCardTitle}>
								{card.title}
							</div>
							<div className={styles.summaryCardValue}>
								{card.value}
							</div>
							<img
								className={styles.summaryCardIllustration}
								src={card.image}
								alt=""
								draggable={false}
							/>
						</div>
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
							if (!Array.isArray(dateStrings)) {
								setDateRange(null);
								return;
							}
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
					size="small"
					columns={columns}
					dataSource={dataSource}
					rowKey="id"
					loading={loading}
					pagination={{
						current: pageNum,
						pageSize,
						total,
						showSizeChanger: true,
						pageSizeOptions: ["10", "15", "20", "25", "50", "100"],
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
