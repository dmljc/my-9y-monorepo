import { Button, DatePicker, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { list } from "./api";
import styles from "./index.module.css";
import type { DeviceDataListQuery, DeviceDataSnapshot } from "./interface";

const { RangePicker } = DatePicker;

interface HistoricalDataFilters {
	modelName: string;
	propertyName: string;
	dateRange: [string, string] | null;
}

function parseInitialFilters(search: string): HistoricalDataFilters {
	const params = new URLSearchParams(search);
	const startTime = params.get("startTime");
	const endTime = params.get("endTime");

	return {
		modelName: "",
		propertyName: params.get("name") ?? "",
		dateRange: startTime && endTime ? [startTime, endTime] : null,
	};
}

const HistoricalData = () => {
	const [searchParams] = useSearchParams();
	const initialFilters = parseInitialFilters(searchParams.toString());
	const [modelName, setModelName] = useState(initialFilters.modelName);
	const [propertyName, setPropertyName] = useState(
		initialFilters.propertyName,
	);
	const [dateRange, setDateRange] = useState<[string, string] | null>(
		initialFilters.dateRange,
	);
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<DeviceDataSnapshot[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(15);

	const loadData = async (
		p: number,
		ps: number,
		filters?: HistoricalDataFilters,
	) => {
		setLoading(true);
		try {
			const active = filters ?? { modelName, propertyName, dateRange };
			const query: DeviceDataListQuery = {
				pageNum: p,
				pageSize: ps,
				modelName: active.modelName.trim() || undefined,
				propertyName: active.propertyName.trim() || undefined,
			};
			if (active.dateRange) {
				query.params = {
					beginDataTime: active.dateRange[0],
					endDataTime: active.dateRange[1],
				};
			}

			const data = await list(query);
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
			loadData(pageNum, pageSize, initialFilters);
		}
	}, []);

	const handleSearch = () => {
		setPageNum(1);
		loadData(1, pageSize);
	};

	const handleReset = () => {
		setModelName("");
		setPropertyName("");
		setDateRange(null);
		setPageNum(1);
		loadData(1, pageSize, {
			modelName: "",
			propertyName: "",
			dateRange: null,
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? pageSize);
	};

	const columns: ColumnsType<DeviceDataSnapshot> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: DeviceDataSnapshot, index: number) =>
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
		{
			title: "值",
			dataIndex: "value",
			key: "value",
			ellipsis: true,
		},
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
				<span className={styles.filterLabel}>物模型名称</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入物模型名称"
					value={modelName}
					allowClear
					onChange={(event) => setModelName(event.target.value)}
					onPressEnter={handleSearch}
				/>
				<span className={styles.filterLabel}>点位名称</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入点位名称"
					value={propertyName}
					allowClear
					onChange={(event) => setPropertyName(event.target.value)}
					onPressEnter={handleSearch}
				/>
				<span className={styles.filterLabel}>时间</span>
				<RangePicker
					format="YYYY-MM-DD HH:mm"
					showTime={{ format: "HH:mm" }}
					className={styles.filterRange}
					placeholder={["开始时间", "结束时间"]}
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
				locale={{
					emptyText: <Empty description="暂无历史数据" />,
				}}
				pagination={{
					current: pageNum,
					pageSize,
					total,
					showSizeChanger: true,
					pageSizeOptions: ["10", "15", "20", "50", "100"],
					showQuickJumper: true,
					showTotal: (count: number) => `共 ${count} 条`,
				}}
				onChange={handleTableChange}
			/>
		</div>
	);
};

export default HistoricalData;
