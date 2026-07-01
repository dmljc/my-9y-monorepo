import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useRef, useState } from "react";
import { create, list, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { Role, RoleFormValues } from "./utils";

const PermissionRole = () => {
	const { message: showMsg, modal: confirmModal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<Role[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<Role | null>(null);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [draftName, setDraftName] = useState("");
	const [appliedName, setAppliedName] = useState("");

	const loadData = useCallback(
		async (p: number, ps: number, name = appliedName) => {
			setLoading(true);
			try {
				const result = await list({ pageNum: p, pageSize: ps, name });
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				showMsg.error("加载角色列表失败");
			} finally {
				setLoading(false);
			}
		},
		[appliedName, showMsg],
	);

	const handleSearch = () => {
		const nextName = draftName.trim();
		setAppliedName(nextName);
		setPageNum(1);
		void loadData(1, pageSize, nextName);
	};

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			void loadData(pageNum, pageSize);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const openAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	const openEdit = (record: Role) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: RoleFormValues) => {
		if (editingRecord) {
			await update(editingRecord.id, values);
			showMsg.success("更新成功");
		} else {
			await create(values);
			showMsg.success("创建成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleDelete = (record: Role) => {
		confirmModal.confirm({
			title: "确认删除",
			content: `确定要删除角色「${record.name}」吗？`,
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

	const handleTableChange = (pagination: TablePaginationConfig) => {
		void loadData(pagination.current ?? 1, pagination.pageSize ?? 10);
	};

	const columns: ColumnsType<Role> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: Role, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "角色名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
		},
		{
			title: "角色编码",
			dataIndex: "code",
			key: "code",
			ellipsis: true,
		},
		{
			title: "描述",
			dataIndex: "description",
			key: "description",
			ellipsis: true,
		},
		{
			title: "创建时间",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 180,
		},
		{
			title: "操作",
			key: "actions",
			fixed: "right",
			width: 150,
			render: (_: unknown, record: Role) => (
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
		<div className={styles.page}>
			<section className={styles.panel}>
				<header className={styles.panelHeader}>
					<div className={styles.filterBar}>
						<span className={styles.filterLabel}>角色名称</span>
						<Input
							className={styles.searchInput}
							placeholder="请输入角色名称"
							value={draftName}
							allowClear
							onChange={(event) =>
								setDraftName(event.target.value)
							}
							onPressEnter={handleSearch}
						/>
						<Button type="primary" onClick={handleSearch}>
							查询
						</Button>
					</div>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={openAdd}
					>
						新增角色
					</Button>
				</header>

				<div className={styles.tableWrap}>
					<Table
						size="middle"
						className={styles.table}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={loading}
						scroll={{ x: 900 }}
						locale={{ emptyText: <Empty description="暂无角色" /> }}
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
				existingRoles={dataSource}
				onCancel={() => setModalOpen(false)}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default PermissionRole;
