import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import Access from "@/components/Access";
import { PERM_WARNING_LEVELS } from "@/constants/permission";
import { create, list, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { LevelFormValues, WarningLevel } from "./utils";
import { parseLevelRows, toAlarmLevelPayload, toWarningLevel } from "./utils";

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
	const [pageSize, setPageSize] = useState(25);

	const loadData = async (p: number, ps: number) => {
		setLoading(true);
		try {
			const data = await list({ pageNum: p, pageSize: ps });
			const { rows, total: count } = parseLevelRows(data);
			setDataSource(rows.map(toWarningLevel));
			setTotal(count);
			setPageNum(p);
			setPageSize(ps);
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

	const handleAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	const handleEdit = (record: WarningLevel) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: LevelFormValues) => {
		if (editingRecord) {
			await update(toAlarmLevelPayload(values, editingRecord.id));
			message.success("编辑成功");
		} else {
			await create(toAlarmLevelPayload(values));
			message.success("新增成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleDelete = (record: WarningLevel) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除报警等级「${record.name}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				await remove(record.id);
				message.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? pageSize);
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
					<Access code={PERM_WARNING_LEVELS.EDIT}>
						<Button
							type="link"
							size="small"
							onClick={() => handleEdit(record)}
						>
							编辑
						</Button>
					</Access>
					<Access code={PERM_WARNING_LEVELS.DELETE}>
						<Button
							type="link"
							size="small"
							onClick={() => handleDelete(record)}
						>
							删除
						</Button>
					</Access>
				</div>
			),
		},
	];

	return (
		<div className={styles.warningLevels}>
			<div className={styles.toolbar}>
				<span className={styles.panelTitle}>
					<span className={styles.panelIcon} aria-hidden />
					<span>报警等级管理</span>
				</span>
				<div className={styles.panelActions}>
					<Access code={PERM_WARNING_LEVELS.CREATE}>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={handleAdd}
						>
							新增
						</Button>
					</Access>
				</div>
			</div>

			<Table
				size="small"
				columns={columns}
				dataSource={dataSource}
				rowKey="id"
				loading={loading}
				locale={{
					emptyText: <Empty description="暂无报警等级" />,
				}}
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
