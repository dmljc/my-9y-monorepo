import { App, Button, DatePicker, Select, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import cardBlueCircleImg from "@/assets/warning/card-blue-circle.webp";
import cardGreenCircleImg from "@/assets/warning/card-green-circle.webp";
import cardOrangeCircleImg from "@/assets/warning/card-orange-circle.webp";
import statSolvedTodayImg from "@/assets/warning/stat-solved-today.webp";
import statTotalTodayImg from "@/assets/warning/stat-total-today.webp";
import statUnsolvedTodayImg from "@/assets/warning/stat-unsolved-today.webp";
import Access from "@/components/Access";
import { PERM_WARNING_LIST } from "@/constants/permission";
import { getStats, list, resolve } from "./api";
import styles from "./index.module.css";
import type { IiotAlarm, StatusFilter, WarningStats } from "./interface";
import {
	buildStatCards,
	STATUS_LABEL,
	STATUS_OPTIONS,
	toAlarmListQuery,
	toWarningStats,
} from "./utils";

const isLightHexColor = (color?: string): boolean => {
	if (!color) return false;
	const raw = color.trim().replace(/^#/, "");
	const hex =
		raw.length === 3
			? raw
					.split("")
					.map((char) => `${char}${char}`)
					.join("")
			: raw;
	if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7;
};

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
	const [dataSource, setDataSource] = useState<IiotAlarm[]>([]);
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
			const rows = (data.list ?? []) as IiotAlarm[];
			setDataSource(rows);
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

	const handleProcess = async (record: IiotAlarm) => {
		const id = String(record.id ?? "");
		setProcessingId(id);
		try {
			await resolve(id);
			message.success("已标记为已解决");
			await loadData(pageNum, pageSize);
			await loadStats();
		} finally {
			setProcessingId(null);
		}
	};

	const handleHistoryQuery = (record: IiotAlarm) => {
		const warningTime = dayjs(record.alarmTime);
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

	const getWarningStatus = (status?: string) =>
		status === "1" || status === "processed" || status === "resolved"
			? "processed"
			: "unprocessed";

	const columns: ColumnsType<IiotAlarm> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			fixed: "left",
			render: (_: unknown, __: IiotAlarm, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "名称",
			key: "name",
			ellipsis: true,
			render: (_: unknown, record: IiotAlarm) =>
				record.propertyName ?? record.deviceName ?? "",
		},
		{
			title: "当前值",
			dataIndex: "currentValue",
			key: "currentValue",
		},
		{
			title: "阈值范围",
			key: "thresholdRange",
			render: (_: unknown, record: IiotAlarm) =>
				`${record.thresholdMin ?? ""}-${record.thresholdMax ?? ""}`,
		},
		{
			title: "等级",
			dataIndex: "levelName",
			key: "level",
			render: (_: unknown, record: IiotAlarm) => {
				const color = record.levelColor ?? "#1677FF";
				const light = isLightHexColor(color);
				return (
					<Tag
						style={{
							color: light ? "#1d2129" : "#fff",
							background: color,
							borderColor: color,
						}}
					>
						{record.levelName}
					</Tag>
				);
			},
		},
		{
			title: "时间",
			dataIndex: "alarmTime",
			key: "alarmTime",
			ellipsis: true,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			render: (status?: string) => {
				const normalized = getWarningStatus(status);
				return (
					<span
						className={
							normalized === "processed"
								? styles.statusProcessed
								: styles.statusUnprocessed
						}
					>
						{STATUS_LABEL[normalized]}
					</span>
				);
			},
		},
		{
			title: "操作",
			key: "actions",
			width: 250,
			fixed: "right",
			render: (_: unknown, record: IiotAlarm) => {
				const normalized = getWarningStatus(record.status);
				return (
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
						{normalized === "unprocessed" && (
							<Access code={PERM_WARNING_LIST.RESOLVE}>
								<Button
									type="link"
									size="small"
									loading={
										processingId === String(record.id ?? "")
									}
									onClick={() => handleProcess(record)}
								>
									标记解决
								</Button>
							</Access>
						)}
					</div>
				);
			},
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
					rowKey={(record) => String(record.id ?? "")}
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
