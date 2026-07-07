import { App, Button, DatePicker, Empty, Input, Select, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { exportLog, list } from "./api";
import styles from "./index.module.css";
import type { OperLogListQuery, SysOperLog } from "./interface";
import {
	formatOperAction,
	getQuickRangeDates,
	QUICK_RANGE_OPTIONS,
	type QuickRange,
} from "./utils";

const { RangePicker } = DatePicker;

const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

const OperationLog = () => {
	const { message } = App.useApp();
	const [quickRange, setQuickRange] = useState<QuickRange>("24h");
	const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(
		getQuickRangeDates("24h"),
	);
	const [userKeyword, setUserKeyword] = useState("");
	const [keyword, setKeyword] = useState("");

	const [loading, setLoading] = useState(false);
	const [exportLoading, setExportLoading] = useState(false);
	const [dataSource, setDataSource] = useState<SysOperLog[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(15);

	const buildQuery = (
		p: number,
		ps: number,
		filters?: {
			userKeyword?: string;
			keyword?: string;
			dateRange?: [Dayjs, Dayjs] | null;
		},
	): OperLogListQuery => {
		const active = filters ?? { userKeyword, keyword, dateRange };
		const user = active.userKeyword?.trim();
		const text = active.keyword?.trim();
		const query: OperLogListQuery = {
			pageNum: p,
			pageSize: ps,
			operName: user,
			createBy: user,
			title: text,
			searchValue: text,
		};
		if (active.dateRange) {
			query.params = {
				beginTime: active.dateRange[0].format(DATE_TIME_FORMAT),
				endTime: active.dateRange[1].format(DATE_TIME_FORMAT),
			};
		}
		return query;
	};

	const loadData = async (
		p: number,
		ps: number,
		filters?: {
			userKeyword?: string;
			keyword?: string;
			dateRange?: [Dayjs, Dayjs] | null;
		},
	) => {
		setLoading(true);
		try {
			const data = await list(buildQuery(p, ps, filters));
			setDataSource(data.list ?? []);
			setTotal(data.total ?? 0);
			setPageNum(data.pageNum ?? p);
			setPageSize(data.pageSize ?? ps);
		} finally {
			setLoading(false);
		}
	};

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			loadData(pageNum, pageSize);
		}
	}, []);

	const handleSearch = () => {
		setPageNum(1);
		loadData(1, pageSize);
	};

	const handleReset = () => {
		const defaultRange = getQuickRangeDates("24h");
		setQuickRange("24h");
		setDateRange(defaultRange);
		setUserKeyword("");
		setKeyword("");
		setPageNum(1);
		loadData(1, pageSize, {
			userKeyword: "",
			keyword: "",
			dateRange: defaultRange,
		});
	};

	const handleQuickRangeChange = (value: QuickRange) => {
		setQuickRange(value);
		setDateRange(getQuickRangeDates(value));
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? pageSize);
	};

	const handleExport = async () => {
		if (total === 0) {
			message.warning("暂无可导出的操作日志");
			return;
		}

		setExportLoading(true);
		try {
			const response = await exportLog(buildQuery(pageNum, pageSize));
			const blob = new Blob([response.data]);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "操作日志.xlsx";
			link.click();
			URL.revokeObjectURL(url);
		} finally {
			setExportLoading(false);
		}
	};

	const columns: ColumnsType<SysOperLog> = [
		{
			title: "时间",
			dataIndex: "operTime",
			key: "operTime",
			ellipsis: true,
		},
		{
			title: "IP地址",
			dataIndex: "operIp",
			key: "operIp",
			ellipsis: true,
		},
		{
			title: "用户名",
			dataIndex: "operName",
			key: "operName",
			ellipsis: true,
		},
		{
			title: "账号",
			dataIndex: "createBy",
			key: "createBy",
			ellipsis: true,
		},
		{
			title: "操作",
			key: "action",
			ellipsis: true,
			render: (_, record) => formatOperAction(record),
		},
	];

	return (
		<div className={styles.operationLog}>
			<div className={styles.toolbar}>
				<span className={styles.filterLabel}>时间范围</span>
				<Select
					className={styles.quickSelect}
					value={quickRange}
					options={QUICK_RANGE_OPTIONS}
					onChange={handleQuickRangeChange}
				/>
				<RangePicker
					className={styles.datePicker}
					value={dateRange}
					showTime
					onChange={(dates) => {
						if (!dates?.[0] || !dates?.[1]) {
							setDateRange(null);
							return;
						}
						setDateRange([dates[0], dates[1]]);
					}}
				/>
				<Input
					className={styles.searchInput}
					placeholder="用户名和账号"
					value={userKeyword}
					allowClear
					onChange={(event) => setUserKeyword(event.target.value)}
					onPressEnter={handleSearch}
				/>
				<Input
					className={styles.keywordInput}
					placeholder="关键词"
					value={keyword}
					allowClear
					onChange={(event) => setKeyword(event.target.value)}
					onPressEnter={handleSearch}
				/>
				<Button type="primary" onClick={handleSearch}>
					查询
				</Button>
				<Button onClick={handleReset}>重置</Button>
				<div className={styles.panelActions}>
					<Button loading={exportLoading} onClick={handleExport}>
						导出
					</Button>
				</div>
			</div>

			<Table
				size="small"
				loading={loading}
				columns={columns}
				dataSource={dataSource}
				rowKey="operId"
				locale={{ emptyText: <Empty description="暂无操作日志" /> }}
				pagination={{
					current: pageNum,
					pageSize,
					total,
					showSizeChanger: true,
					pageSizeOptions: ["10", "15", "20", "50", "100"],
					showQuickJumper: true,
					showTotal: (count) => `共 ${count} 条`,
				}}
				onChange={handleTableChange}
			/>
		</div>
	);
};

export default OperationLog;
