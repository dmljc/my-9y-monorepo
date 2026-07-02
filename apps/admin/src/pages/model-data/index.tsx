import { App, Button, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { list, type ModelDataRecord, remove, sync } from "./api";
import styles from "./index.module.css";
import { toListParams } from "./utils";

const ModelData = () => {
	const { message, modal } = App.useApp();
	const [draftDeviceName, setDraftDeviceName] = useState("");
	const [appliedDeviceName, setAppliedDeviceName] = useState("");
	const [tableLoading, setTableLoading] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [dataSource, setDataSource] = useState<ModelDataRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const loadData = useCallback(
		async (p: number, ps: number, deviceName = appliedDeviceName) => {
			setTableLoading(true);
			try {
				const result = await list(toListParams(p, ps, deviceName));
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				message.error("加载物模型数据失败");
			} finally {
				setTableLoading(false);
			}
		},
		[appliedDeviceName, message],
	);

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			void loadData(pageNum, pageSize);
		}
	}, []);

	const handleSearch = () => {
		const nextDeviceName = draftDeviceName.trim();
		setAppliedDeviceName(nextDeviceName);
		setPageNum(1);
		void loadData(1, pageSize, nextDeviceName);
	};

	const handleReset = () => {
		setDraftDeviceName("");
		setAppliedDeviceName("");
		setPageNum(1);
		void loadData(1, pageSize, "");
	};

	const handleSync = useCallback(async () => {
		setSyncing(true);
		try {
			await sync();
			message.success("同步成功");
			await loadData(pageNum, pageSize);
		} catch {
			message.error("同步失败");
		} finally {
			setSyncing(false);
		}
	}, [loadData, pageNum, pageSize, message]);

	const handleDelete = useCallback(
		(record: ModelDataRecord) => {
			modal.confirm({
				title: "确认删除",
				content: `确定要删除物模型数据「${record.modelName} / ${record.pointName}」吗？`,
				okText: "删除",
				okButtonProps: { danger: true },
				cancelText: "取消",
				onOk: async () => {
					await remove(record.id);
					message.success("删除成功");
					await loadData(pageNum, pageSize);
				},
			});
		},
		[modal, loadData, pageNum, pageSize, message],
	);

	const handleTableChange = (pagination: TablePaginationConfig) => {
		const nextPageNum = pagination.current ?? 1;
		const nextPageSize = pagination.pageSize ?? 10;
		setPageNum(nextPageNum);
		setPageSize(nextPageSize);
		void loadData(nextPageNum, nextPageSize);
	};

	const columns = useMemo<ColumnsType<ModelDataRecord>>(
		() => [
			{
				title: "序号",
				key: "index",
				width: 72,
				align: "center",
				render: (_: unknown, __: ModelDataRecord, index: number) =>
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
				dataIndex: "pointName",
				key: "pointName",
				ellipsis: true,
			},
			{
				title: "点位ID",
				dataIndex: "pointId",
				key: "pointId",
				ellipsis: true,
			},
			{
				title: "类型",
				dataIndex: "type",
				key: "type",
				width: 100,
			},
			{
				title: "值",
				dataIndex: "value",
				key: "value",
				width: 100,
			},
			{
				title: "时间",
				dataIndex: "time",
				key: "time",
				width: 180,
				render: (time: string) => time || "-",
			},
			{
				title: "操作",
				key: "actions",
				width: 80,
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
		],
		[handleDelete, pageNum, pageSize],
	);

	return (
		<div className={styles.modelData}>
			<section className={styles.panel}>
				<header className={styles.panelHeader}>
					<div className={styles.filterBar}>
						<span className={styles.filterLabel}>设备名称</span>
						<Input
							className={styles.searchInput}
							placeholder="请输入设备名称"
							value={draftDeviceName}
							allowClear
							onChange={(event) =>
								setDraftDeviceName(event.target.value)
							}
							onPressEnter={handleSearch}
						/>
						<Button type="primary" onClick={handleSearch}>
							查询
						</Button>
						<Button onClick={handleReset}>重置</Button>
					</div>
					<Button
						type="default"
						loading={syncing}
						onClick={handleSync}
						className={styles.syncButton}
					>
						同步
					</Button>
				</header>

				<div className={styles.tableWrap}>
					<Table
						size="small"
						className={styles.modelDataTable}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={tableLoading}
						scroll={{ x: 960 }}
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
			</section>
		</div>
	);
};

export default ModelData;
