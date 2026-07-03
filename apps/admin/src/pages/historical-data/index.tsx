import { Button, DatePicker, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { list } from "./api";
import styles from "./index.module.css";
import type {
	DeviceDataListQuery,
	DeviceDataListResponse,
	DeviceDataSnapshot,
} from "./interface";

const { RangePicker } = DatePicker;

interface DeviceFilter {
	modelName: string;
	propertyName: string;
	dateRange: [string, string] | null;
}

const EMPTY_FILTER: DeviceFilter = {
	modelName: "",
	propertyName: "",
	dateRange: null,
};

function parseInitialFilter(search: string): DeviceFilter {
	const params = new URLSearchParams(search);
	const startTime = params.get("startTime");
	const endTime = params.get("endTime");

	return {
		modelName: params.get("name") ?? "",
		propertyName: "",
		dateRange: startTime && endTime ? [startTime, endTime] : null,
	};
}

const HistoricalData = () => {
	const [searchParams] = useSearchParams();
	const [filter, setFilter] = useState(() =>
		parseInitialFilter(searchParams.toString()),
	);
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<DeviceDataSnapshot[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const loadData = async (
		p: number,
		ps: number,
		activeFilter: DeviceFilter = filter,
	) => {
		setLoading(true);
		try {
			const query: DeviceDataListQuery = {
				pageNum: p,
				pageSize: ps,
				modelName: activeFilter.modelName.trim() || undefined,
				propertyName: activeFilter.propertyName.trim() || undefined,
			};
			if (activeFilter.dateRange) {
				query.params = {
					beginDataTime: activeFilter.dateRange[0],
					endDataTime: activeFilter.dateRange[1],
				};
			}

			const data: DeviceDataListResponse = await list(query);
			setDataSource(data.list);
			setTotal(data.total);
			setPageNum(data.pageNum);
			setPageSize(data.pageSize);
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
		setFilter(EMPTY_FILTER);
		setPageNum(1);
		loadData(1, pageSize, EMPTY_FILTER);
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? 10);
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
					value={filter.modelName}
					allowClear
					onChange={(event) =>
						setFilter((prev) => ({
							...prev,
							modelName: event.target.value,
						}))
					}
					onPressEnter={handleSearch}
				/>
				<span className={styles.filterLabel}>点位名称</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入点位名称"
					value={filter.propertyName}
					allowClear
					onChange={(event) =>
						setFilter((prev) => ({
							...prev,
							propertyName: event.target.value,
						}))
					}
					onPressEnter={handleSearch}
				/>
				<span className={styles.filterLabel}>时间</span>
				<RangePicker
					format="YYYY-MM-DD HH:mm"
					showTime={{ format: "HH:mm" }}
					className={styles.filterRange}
					placeholder={["开始时间", "结束时间"]}
					value={
						filter.dateRange
							? [
									dayjs(filter.dateRange[0]),
									dayjs(filter.dateRange[1]),
								]
							: null
					}
					onChange={(_, dateStrings) => {
						const [start, end] = dateStrings;
						setFilter((prev) => ({
							...prev,
							dateRange: start && end ? [start, end] : null,
						}));
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
					showQuickJumper: true,
					showTotal: (count: number) => `共 ${count} 条`,
				}}
				onChange={handleTableChange}
			/>
		</div>
	);
};

export default HistoricalData;
