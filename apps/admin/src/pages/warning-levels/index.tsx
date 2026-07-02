import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useRef, useState } from "react";
import { create, list, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { LevelFormValues, WarningLevel } from "./utils";

const WarningLevels = () => {
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<WarningLevel[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<WarningLevel | null>(
		null,
	);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);

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
				message.error("加载报警等级失败");
			} finally {
				setLoading(false);
			}
		},
		[message],
	);

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			void loadData(pageNum, pageSize);
		}
	}, []);

	const openAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	const openEdit = (record: WarningLevel) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: LevelFormValues) => {
		if (editingRecord) {
			await update(editingRecord.id, values);
			message.success("更新成功");
		} else {
			await create(values);
			message.success("创建成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleDelete = (record: WarningLevel) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除报警等级「${record.name}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			cancelText: "取消",
			onOk: async () => {
				await remove(record.id);
				message.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		void loadData(pagination.current ?? 1, pagination.pageSize ?? 10);
	};

	const columns: ColumnsType<WarningLevel> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: WarningLevel, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "等级名称",
			dataIndex: "name",
			key: "name",
		},
		{
			title: "颜色",
			dataIndex: "color",
			key: "color",
			render: (color: string) => (
				<div className={styles.colorCell}>
					<span
						className={styles.colorBar}
						style={{ backgroundColor: color }}
						aria-hidden
					/>
					<span className={styles.colorValue}>{color}</span>
				</div>
			),
		},
		{
			title: "操作",
			key: "actions",
			fixed: "right",
			render: (_: unknown, record: WarningLevel) => (
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
				</div>
			),
		},
	];

	return (
		<div className={styles.warningLevels}>
			<section className={styles.panel}>
				<header className={styles.panelHeader}>
					<div className={styles.panelTitle}>
						<span className={styles.panelIcon} aria-hidden />
						<span>报警等级管理</span>
					</div>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={openAdd}
					>
						新增等级
					</Button>
				</header>

				<div className={styles.tableWrap}>
					<Table
						size="small"
						className={styles.levelTable}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={loading}
						scroll={{ x: 640 }}
						locale={{
							emptyText: <Empty description="暂无报警等级" />,
						}}
						pagination={{
							current: pageNum,
							pageSize,
							total,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (count) => `共 ${count} 条`,
						}}
						onChange={handleTableChange}
					/>
				</div>
			</section>

			<CreateModal
				open={modalOpen}
				editingRecord={editingRecord}
				onCancel={() => setModalOpen(false)}
				onSubmit={handleModalSubmit}
			/>
		</div>
	);
};

export default WarningLevels;
