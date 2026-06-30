import { App, Button, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type DeviceRecord, list, remove, sync } from "./api";
import styles from "./index.module.css";

const DeviceData = () => {
	const { message: showMsg, modal: confirmModal } = App.useApp();
	const [tableLoading, setTableLoading] = useState(false);
	const [draftDeviceName, setDraftDeviceName] = useState("");
	const [appliedDeviceName, setAppliedDeviceName] = useState("");
	const [dataSource, setDataSource] = useState<DeviceRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const loadData = useCallback(
		async (p: number, ps: number, deviceName = appliedDeviceName) => {
			setTableLoading(true);
			try {
				const result = await list({
					pageNum: p,
					pageSize: ps,
					deviceName,
				});
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				showMsg.error("加载设备数据失败");
			} finally {
				setTableLoading(false);
			}
		},
		[appliedDeviceName, showMsg],
	);

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			void loadData(pageNum, pageSize);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSearch = () => {
		const nextDeviceName = draftDeviceName.trim();
		setAppliedDeviceName(nextDeviceName);
		setPageNum(1);
		void loadData(1, pageSize, nextDeviceName);
	};

	const [syncing, setSyncing] = useState(false);

	const handleSync = useCallback(async () => {
		setSyncing(true);
		try {
			await sync();
			showMsg.success("同步成功");
			await loadData(pageNum, pageSize);
		} catch {
			showMsg.error("同步失败");
		} finally {
			setSyncing(false);
		}
	}, [loadData, pageNum, pageSize, showMsg]);

	const handleDelete = useCallback(
		(record: DeviceRecord) => {
			confirmModal.confirm({
				title: "确认删除",
				content: `确定要删除设备数据「${record.deviceName}」吗？`,
				okText: "删除",
				okButtonProps: { danger: true },
				cancelText: "取消",
				onOk: async () => {
					await remove(record.id);
					showMsg.success("删除成功");
					await loadData(pageNum, pageSize);
				},
			});
		},
		[confirmModal, loadData, pageNum, pageSize, showMsg],
	);

	const handleTableChange = (pagination: TablePaginationConfig) => {
		const nextPageNum = pagination.current ?? 1;
		const nextPageSize = pagination.pageSize ?? 10;
		setPageNum(nextPageNum);
		setPageSize(nextPageSize);
		void loadData(nextPageNum, nextPageSize);
	};

	const columns = useMemo<ColumnsType<DeviceRecord>>(
		() => [
			{ title: "点位名称", dataIndex: "pointName", key: "pointName" },
			{
				title: "地址",
				dataIndex: "address",
				key: "address",
			},
			{ title: "设备名称", dataIndex: "deviceName", key: "deviceName" },
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
			},
			{
				title: "操作",
				key: "actions",
				width: 120,
				render: (_: unknown, record) => (
					<Button
						type="link"
						size="small"
						onClick={() => handleDelete(record)}
					>
						删除
					</Button>
				),
			},
		],
		[handleDelete],
	);

	return (
		<div className={styles.device}>
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
						size="middle"
						className={styles.deviceTable}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={tableLoading}
						locale={{
							emptyText: <Empty description="暂无设备数据" />,
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

export default DeviceData;
