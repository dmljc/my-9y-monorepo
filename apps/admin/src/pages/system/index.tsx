import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ApiConfig, list, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import { STATUS_COLOR } from "./utils";

const System = () => {
	const { message: showMsg, modal: confirmModal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<ApiConfig[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<ApiConfig | null>(null);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	/** 加载分页列表 */
	const loadData = useCallback(
		async (p: number, ps: number) => {
			setLoading(true);
			try {
				const result = await list({ pageNum: p, pageSize: ps });
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				showMsg.error("加载接口配置失败");
			} finally {
				setLoading(false);
			}
		},
		[showMsg],
	);

	/** 首次加载 */
	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			void loadData(pageNum, pageSize);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/** 打开新增弹窗 */
	const openAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	/** 打开编辑弹窗 */
	const openEdit = (record: ApiConfig) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	/** 弹窗操作成功后刷新当前页 */
	const handleSuccess = () => {
		showMsg.success(editingRecord ? "更新成功" : "创建成功");
		void loadData(pageNum, pageSize);
	};

	/** 关闭弹窗 */
	const handleCancel = () => setModalOpen(false);

	/** 删除 */
	const handleDelete = (record: ApiConfig) => {
		confirmModal.confirm({
			title: "确认删除",
			content: `确定要删除接口「${record.name}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			cancelText: "取消",
			onOk: async () => {
				await remove(record.id);
				showMsg.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
	};

	/** 刷新（模拟同步） */
	const handleRefresh = async (record: ApiConfig) => {
		showMsg.loading({ content: "正在同步…", key: "refresh" });
		await update(record.id, {});
		await loadData(pageNum, pageSize);
		showMsg.success({ content: "同步完成", key: "refresh" });
	};

	/** 分页变化 */
	const handleTableChange = (pagination: TablePaginationConfig) => {
		void loadData(pagination.current ?? 1, pagination.pageSize ?? 10);
	};

	const columns: ColumnsType<ApiConfig> = [
		{ title: "名称", dataIndex: "name", key: "name" },
		{ title: "类型", dataIndex: "type", key: "type" },
		{ title: "URL", dataIndex: "url", key: "url", ellipsis: true },
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 90,
			render: (status: string) => (
				<Tag color={STATUS_COLOR[status] ?? "default"}>{status}</Tag>
			),
		},
		{
			title: "最后同步时间",
			dataIndex: "lastSyncTime",
			key: "lastSyncTime",
			width: 180,
		},
		{
			title: "操作",
			key: "actions",
			width: 180,
			render: (_: unknown, record: ApiConfig) => (
				<div className={styles.actions}>
					<Button
						type="link"
						size="small"
						onClick={() => openEdit(record)}
					>
						编辑
					</Button>
					<Button
						type="link"
						size="small"
						onClick={() => handleDelete(record)}
					>
						删除
					</Button>
					<Button
						type="link"
						size="small"
						onClick={() => handleRefresh(record)}
					>
						刷新
					</Button>
				</div>
			),
		},
	];

	return (
		<div className={styles.system}>
			<section className={styles.panel}>
				<header className={styles.panelHeader}>
					<div className={styles.panelTitle}>
						<span className={styles.panelIcon} aria-hidden />
						<span>API接口配置</span>
					</div>
					<Button icon={<PlusOutlined />} onClick={openAdd}>
						添加接口
					</Button>
				</header>

				<div className={styles.tableWrap}>
					<Table
						size="middle"
						className={styles.configTable}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={loading}
						pagination={{
							current: pageNum,
							pageSize,
							total,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (t: number) => `共 ${t} 条`,
						}}
						onChange={handleTableChange}
					/>
				</div>
			</section>

			<CreateModal
				open={modalOpen}
				editingRecord={editingRecord}
				onCancel={handleCancel}
				onSuccess={handleSuccess}
			/>
		</div>
	);
};

export default System;
