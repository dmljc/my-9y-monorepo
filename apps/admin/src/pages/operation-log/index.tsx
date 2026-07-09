import { App, Button, DatePicker, Empty, Input, Select, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import Access from "@/components/Access";
import { PERM_OPERATION_LOG } from "@/constants/permission";
import { downloadBlob, resolveExportBlob, XLSX_MIME } from "@/utils";
import { exportLog, list } from "./api";
import styles from "./index.module.css";
import type { OperLogListQuery, SysOperLog } from "./interface";
import {
	buildExportFileName,
	DATE_TIME_FORMAT,
	DEFAULT_QUICK_RANGE,
	formatOperAction,
	getQuickRangeDates,
	QUICK_RANGE_OPTIONS,
	type QuickRange,
} from "./utils";

const { RangePicker } = DatePicker;

const OperationLog = () => {
	const { message } = App.useApp();
	const [quickRange, setQuickRange] =
		useState<QuickRange>(DEFAULT_QUICK_RANGE);
	const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(
		getQuickRangeDates(DEFAULT_QUICK_RANGE),
	);
	const [userName, setUserName] = useState("");
	const [operName, setOperName] = useState("");

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
			userName?: string;
			operName?: string;
			dateRange?: [Dayjs, Dayjs] | null;
		},
	): OperLogListQuery => {
		const active = filters ?? { userName, operName, dateRange };
		const query: OperLogListQuery = {
			pageNum: p,
			pageSize: ps,
			userName: active.userName?.trim(),
			operName: active.operName?.trim(),
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
			userName?: string;
			operName?: string;
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
		const defaultRange = getQuickRangeDates(DEFAULT_QUICK_RANGE);
		setQuickRange(DEFAULT_QUICK_RANGE);
		setDateRange(defaultRange);
		setUserName("");
		setOperName("");
		setPageNum(1);
		loadData(1, pageSize, {
			userName: "",
			operName: "",
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
			const blob = await resolveExportBlob(
				response.data instanceof Blob
					? response.data
					: new Blob([response.data], { type: XLSX_MIME }),
				XLSX_MIME,
			);
			downloadBlob(blob, buildExportFileName());
		} catch (error) {
			if (error instanceof Error) {
				message.error(error.message);
			}
		} finally {
			setExportLoading(false);
		}
	};

	const columns: ColumnsType<SysOperLog> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_, __, index) => (pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "账号",
			dataIndex: "userName",
			key: "userName",
			ellipsis: true,
		},
		{
			title: "用户名",
			dataIndex: "operName",
			key: "operName",
			ellipsis: true,
		},
		{
			title: "操作",
			key: "action",
			ellipsis: true,
			render: (_, record) => formatOperAction(record),
		},
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
	];

	return (
		<div className={styles.operationLog}>
			<div className={styles.toolbar}>
				<span className={styles.filterLabel}>账号</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入账号"
					value={userName}
					allowClear
					onChange={(event) => setUserName(event.target.value)}
					onPressEnter={handleSearch}
				/>
				<span className={styles.filterLabel}>用户名</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入用户名"
					value={operName}
					allowClear
					onChange={(event) => setOperName(event.target.value)}
					onPressEnter={handleSearch}
				/>
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
				<Button type="primary" onClick={handleSearch}>
					查询
				</Button>
				<Button onClick={handleReset}>重置</Button>
				<div className={styles.panelActions}>
					<Access code={PERM_OPERATION_LOG.EXPORT}>
						<Button loading={exportLoading} onClick={handleExport}>
							导出
						</Button>
					</Access>
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
