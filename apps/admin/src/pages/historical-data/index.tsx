import { Button, DatePicker, Empty, Select, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { list } from "./api";
import styles from "./index.module.css";
import type {
	HistoricalDataListQuery,
	HistoricalDataRecord,
} from "./interface";

type QuickRange = "24h" | "7d" | "15d" | "30d";

const DEFAULT_QUICK_RANGE: QuickRange = "24h";

const QUICK_RANGE_OPTIONS = [
	{ label: "近24小时", value: "24h" },
	{ label: "近7天", value: "7d" },
	{ label: "近15天", value: "15d" },
	{ label: "近30天", value: "30d" },
];

const getQuickRangeDates = (range: QuickRange): [Dayjs, Dayjs] => {
	const end = dayjs();
	const amountMap: Record<QuickRange, number> = {
		"24h": 1,
		"7d": 7,
		"15d": 15,
		"30d": 30,
	};
	return [end.subtract(amountMap[range], "day"), end];
};

interface HistoricalDataFilters {
	dateRange: [Dayjs, Dayjs] | null;
}

const HistoricalData = () => {
	const [searchParams] = useSearchParams();
	const startTime = searchParams.get("startTime");
	const endTime = searchParams.get("endTime");
	const initialDateRange =
		startTime &&
		endTime &&
		dayjs(startTime).isValid() &&
		dayjs(endTime).isValid()
			? ([dayjs(startTime), dayjs(endTime)] as [Dayjs, Dayjs])
			: null;
	const [quickRange, setQuickRange] = useState<QuickRange | undefined>(
		initialDateRange ? undefined : DEFAULT_QUICK_RANGE,
	);
	const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(
		() => initialDateRange ?? getQuickRangeDates(DEFAULT_QUICK_RANGE),
	);
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<HistoricalDataRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const initRef = useRef(false);

	const loadData = async (
		p: number,
		ps: number,
		filters?: HistoricalDataFilters,
	) => {
		const activeFilters = filters ?? { dateRange };
		const query: HistoricalDataListQuery = {
			thingId: searchParams.get("thingId") ?? "",
			propertyId: `/${searchParams.get("propertyId") ?? ""}`,
			pageNum: p,
			pageSize: ps,
		};
		if (activeFilters.dateRange) {
			query.startTime = activeFilters.dateRange[0].format(
				"YYYY-MM-DD HH:mm:ss",
			);
			query.endTime = activeFilters.dateRange[1].format(
				"YYYY-MM-DD HH:mm:ss",
			);
		}

		setLoading(true);
		try {
			const data = await list(query);
			setDataSource(data.list ?? []);
			setTotal(data.total ?? 0);
			setPageNum(data.pageNum ?? p);
			setPageSize(data.pageSize ?? ps);
		} finally {
			setLoading(false);
		}
	};

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
		setPageNum(1);
		loadData(1, pageSize, {
			dateRange: defaultRange,
		});
	};

	const handleQuickRangeChange = (value: QuickRange) => {
		setQuickRange(value);
		setDateRange(getQuickRangeDates(value));
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		const nextPageSize = pagination.pageSize ?? pageSize;
		const nextPageNum =
			nextPageSize === pageSize ? (pagination.current ?? 1) : 1;
		setPageNum(nextPageNum);
		setPageSize(nextPageSize);
		loadData(nextPageNum, nextPageSize);
	};

	const columns: ColumnsType<HistoricalDataRecord> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: HistoricalDataRecord, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "物模型名称",
			dataIndex: "modelName",
			key: "modelName",
			ellipsis: true,
		},
		{
			title: "点位名称",
			dataIndex: "propertyName",
			key: "propertyName",
			ellipsis: true,
		},
		{
			title: "点位ID",
			dataIndex: "propertyId",
			key: "propertyId",
			ellipsis: true,
		},
		{
			title: "类型",
			dataIndex: "dataType",
			key: "dataType",
			ellipsis: true,
		},
		{ title: "值", dataIndex: "value", key: "value", ellipsis: true },
		{
			title: "时间",
			dataIndex: "dataTime",
			key: "dataTime",
			ellipsis: true,
		},
	];

	return (
		<div className={styles.historicalData}>
			<div className={styles.toolbar}>
				<span className={styles.filterLabel}>时间范围</span>
				<Select
					className={styles.quickSelect}
					value={quickRange}
					options={QUICK_RANGE_OPTIONS}
					onChange={handleQuickRangeChange}
				/>
				<DatePicker.RangePicker
					className={styles.datePicker}
					showTime
					value={dateRange}
					onChange={(value) => {
						if (!value?.[0] || !value?.[1]) {
							setDateRange(null);
							setQuickRange(undefined);
							return;
						}
						setDateRange([value[0], value[1]]);
						setQuickRange(undefined);
					}}
				/>
				<Button type="primary" onClick={handleSearch}>
					查询
				</Button>
				<Button onClick={handleReset}>重置</Button>
			</div>

			<Table
				size="small"
				columns={columns}
				dataSource={dataSource}
				rowKey="id"
				loading={loading}
				locale={{ emptyText: <Empty description="暂无历史数据" /> }}
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
	);
};

export default HistoricalData;
