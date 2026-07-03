import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import PermissionAssignModal from "./PermissionAssignModal";
import type { Role, RoleFormValues } from "./utils";
import {
	create,
	formatPermissionCount,
	formatRoleCreatedAt,
	isSystemRole,
	list,
	remove,
	update,
	updatePermissions,
} from "./utils";

const PermissionRole = () => {
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<Role[]>([]);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<Role | null>(null);
	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [assigningRecord, setAssigningRecord] = useState<Role | null>(null);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [draftName, setDraftName] = useState("");
	const [appliedName, setAppliedName] = useState("");
	const initRef = useRef(false);

	const loadData = async (p: number, ps: number, name = appliedName) => {
		setLoading(true);
		try {
			const result = await list({ pageNum: p, pageSize: ps, name });
			setDataSource(result.list);
			setTotal(result.total);
			setPageNum(result.pageNum);
			setPageSize(result.pageSize);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		const nextName = draftName.trim();
		setAppliedName(nextName);
		setPageNum(1);
		loadData(1, pageSize, nextName);
	};

	const handleReset = () => {
		setDraftName("");
		setAppliedName("");
		setPageNum(1);
		loadData(1, pageSize, "");
	};

	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			loadData(pageNum, pageSize);
		}
	}, []);

	const handleAdd = () => {
		setEditingRecord(null);
		setCreateModalOpen(true);
	};

	const handleEdit = (record: Role) => {
		setEditingRecord(record);
		setCreateModalOpen(true);
	};

	const handleAssign = (record: Role) => {
		setAssigningRecord(record);
		setAssignModalOpen(true);
	};

	const handleModalSubmit = async (values: RoleFormValues) => {
		try {
			if (editingRecord) {
				await update(editingRecord.id, values, editingRecord.code);
				message.success("保存成功");
			} else {
				await create(values);
				message.success("添加成功");
			}
			await loadData(pageNum, pageSize);
		} catch {
			throw new Error("submit failed");
		}
	};

	const handleAssignPermissions = async (permissionIds: string[]) => {
		if (!assigningRecord) return;
		await updatePermissions(assigningRecord.id, permissionIds);
		await loadData(pageNum, pageSize);
	};

	const handleDelete = (record: Role) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除角色「${record.name}」吗？`,
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
		loadData(pagination.current ?? 1, pagination.pageSize ?? 10);
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
			title: "名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
		},
		{
			title: "角色描述",
			dataIndex: "description",
			key: "description",
			ellipsis: true,
		},
		{
			title: "关联用户",
			dataIndex: "userCount",
			key: "userCount",
			align: "center",
		},
		{
			title: "权限数量",
			key: "permissionCount",
			align: "center",
			render: (_: unknown, record: Role) => formatPermissionCount(record),
		},
		{
			title: "创建时间",
			key: "createdAt",
			render: (_: unknown, record: Role) => formatRoleCreatedAt(record),
		},
		{
			title: "操作",
			key: "actions",
			fixed: "right",
			render: (_: unknown, record: Role) => {
				if (isSystemRole(record)) {
					return "-";
				}
				return (
					<div className={styles.actions}>
						<Button
							type="link"
							size="small"
							onClick={() => handleEdit(record)}
						>
							编辑
						</Button>
						<Button
							type="link"
							size="small"
							onClick={() => handleAssign(record)}
						>
							权限分配
						</Button>
						<Button
							type="link"
							size="small"
							onClick={() => handleDelete(record)}
						>
							删除
						</Button>
					</div>
				);
			},
		},
	];

	return (
		<div className={styles.permissionRole}>
			<div className={styles.toolbar}>
				<span className={styles.filterLabel}>角色名称</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入角色名称"
					value={draftName}
					allowClear
					onChange={(event) => setDraftName(event.target.value)}
					onPressEnter={handleSearch}
				/>
				<Button type="primary" onClick={handleSearch}>
					查询
				</Button>
				<Button onClick={handleReset}>重置</Button>
				<div className={styles.panelActions}>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={handleAdd}
					>
						新增角色
					</Button>
				</div>
			</div>

			<Table
				size="small"
				columns={columns}
				dataSource={dataSource}
				rowKey="id"
				loading={loading}
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

			<CreateModal
				open={createModalOpen}
				editingRecord={editingRecord}
				existingRoles={dataSource}
				onCancel={() => {
					setCreateModalOpen(false);
					setEditingRecord(null);
				}}
				onOk={handleModalSubmit}
			/>

			<PermissionAssignModal
				open={assignModalOpen}
				role={assigningRecord}
				onCancel={() => {
					setAssignModalOpen(false);
					setAssigningRecord(null);
				}}
				onOk={handleAssignPermissions}
			/>
		</div>
	);
};

export default PermissionRole;
