import { App, Button, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";
import type { DeviceDataSnapshot } from "./interface";
import { list, type ModelDataListParams, remove, sync } from "./utils";

const ModelData = () => {
	const { message, modal } = App.useApp();
	const [modelName, setModelName] = useState("");
	const [propertyName, setPropertyName] = useState("");
	const [loading, setLoading] = useState(false);
	const [syncLoading, setSyncLoading] = useState(false);
	const [dataSource, setDataSource] = useState<DeviceDataSnapshot[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const initRef = useRef(false);

	const loadData = async (
		p: number,
		ps: number,
		filters?: Pick<ModelDataListParams, "modelName" | "propertyName">,
	) => {
		setLoading(true);
		try {
			const result = await list({
				pageNum: p,
				pageSize: ps,
				modelName:
					filters?.modelName ?? (modelName.trim() || undefined),
				propertyName:
					filters?.propertyName ?? (propertyName.trim() || undefined),
			});
			setDataSource(result.list);
			setTotal(result.total);
			setPageNum(result.pageNum);
			setPageSize(result.pageSize);
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
		setModelName("");
		setPropertyName("");
		setPageNum(1);
		loadData(1, pageSize, {});
	};

	const handleSync = async () => {
		setSyncLoading(true);
		try {
			await sync();
			message.success("同步成功");
			await loadData(pageNum, pageSize);
		} finally {
			setSyncLoading(false);
		}
	};

	const handleDelete = (record: DeviceDataSnapshot) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除物模型数据「${record.modelName ?? ""} / ${record.propertyName ?? ""}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				await remove(String(record.id));
				message.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
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
		{
			title: "操作",
			key: "actions",
			fixed: "right",
			render: (_: unknown, record) => (
				<div className={styles.actions}>
					<Button
						type="link"
						size="small"
						onClick={() => handleDelete(record)}
					>
						删除
					</Button>
				</div>
			),
		},
	];

	return (
		<div className={styles.modelData}>
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
				<Button type="primary" onClick={handleSearch}>
					查询
				</Button>
				<Button onClick={handleReset}>重置</Button>
				<div className={styles.panelActions}>
					<Button loading={syncLoading} onClick={handleSync}>
						同步
					</Button>
				</div>
			</div>

			<Table
				size="small"
				columns={columns}
				dataSource={dataSource}
				rowKey="id"
				loading={loading}
				locale={{
					emptyText: <Empty description="暂无物模型数据" />,
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

export default ModelData;
