import { Empty, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { list } from "./api";
import styles from "./index.module.css";
import type {
	WarningHistoryListQuery,
	WarningHistoryRecord,
} from "./interface";

const WarningHistory = () => {
	const [searchParams] = useSearchParams();
	const alarmTime = searchParams.get("alarmTime");
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<WarningHistoryRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const initRef = useRef(false);

	const loadData = async (p: number, ps: number) => {
		const query: WarningHistoryListQuery = {
			thingId: searchParams.get("thingId") ?? "",
			propertyId: `/${searchParams.get("propertyId") ?? ""}`,
			alarmTime: alarmTime ?? "",
		};

		setLoading(true);
		try {
			const data = await list(query);
			const records: WarningHistoryRecord[] = Array.isArray(data)
				? data
				: (data.list ?? data.rows ?? []);
			setDataSource(records);
			setTotal(records.length);
			setPageNum(p);
			setPageSize(ps);
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

	const handleTableChange = (pagination: TablePaginationConfig) => {
		const nextPageSize = pagination.pageSize ?? pageSize;
		const nextPageNum =
			nextPageSize === pageSize ? (pagination.current ?? 1) : 1;
		setPageNum(nextPageNum);
		setPageSize(nextPageSize);
	};

	const columns: ColumnsType<WarningHistoryRecord> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: WarningHistoryRecord, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "物模型ID",
			dataIndex: "modelId",
			key: "modelId",
			ellipsis: true,
		},
		{
			title: "物模型名称",
			dataIndex: "modelName",
			key: "modelName",
			ellipsis: true,
		},
		{
			title: "实例ID",
			dataIndex: "thingId",
			key: "thingId",
			ellipsis: true,
		},
		{
			title: "实例名称",
			dataIndex: "thingName",
			key: "thingName",
			ellipsis: true,
		},
		{
			title: "点位ID",
			dataIndex: "propertyId",
			key: "propertyId",
			ellipsis: true,
		},
		{
			title: "点位名称",
			dataIndex: "propertyName",
			key: "propertyName",
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
		<div className={styles.warningHistory}>
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

export default WarningHistory;
