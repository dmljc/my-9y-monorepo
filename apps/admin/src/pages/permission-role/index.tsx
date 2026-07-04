import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import AssignModal from "./AssignModal";
import {
	create as createRole,
	list as fetchRoleList,
	remove as removeRole,
	update as updateRole,
	updatePermissions as updateRolePermissions,
} from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { RoleListQuery, RoleListResponse, SysRole } from "./interface";
import type { RoleFormValues } from "./utils";
import { formatPermissionCount } from "./utils";

const PermissionRole = () => {
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<SysRole[]>([]);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<SysRole | null>(null);
	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [assigningRecord, setAssigningRecord] = useState<SysRole | null>(
		null,
	);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [roleName, setRoleName] = useState("");
	const initRef = useRef(false);

	const loadData = async (p: number, ps: number, name = roleName) => {
		setLoading(true);
		try {
			const query: RoleListQuery = {
				pageNum: p,
				pageSize: ps,
				roleName: name.trim() || undefined,
			};
			const data: RoleListResponse = await fetchRoleList(query);
			setDataSource(data.list);
			setTotal(data.total ?? 0);
			setPageNum(p);
			setPageSize(ps);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		setPageNum(1);
		loadData(1, pageSize);
	};

	const handleReset = () => {
		setRoleName("");
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

	const handleEdit = (record: SysRole) => {
		setEditingRecord(record);
		setCreateModalOpen(true);
	};

	const handleAssign = (record: SysRole) => {
		setAssigningRecord(record);
		setAssignModalOpen(true);
	};

	const handleModalSubmit = async (values: RoleFormValues) => {
		if (editingRecord?.roleId !== undefined) {
			await updateRole({
				roleId: editingRecord.roleId,
				roleName: values.roleName.trim(),
				remark: values.remark?.trim() ?? "",
				roleKey: editingRecord.roleKey,
			});
			message.success("保存成功");
		} else {
			await createRole({
				roleName: values.roleName.trim(),
				remark: values.remark?.trim() ?? "",
			});
			message.success("新增成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleAssignPermissions = async (menuIds: number[]) => {
		if (assigningRecord?.roleId === undefined) return;
		await updateRolePermissions({
			roleId: assigningRecord.roleId,
			menuIds,
		});
		message.success("权限分配成功");
		await loadData(pageNum, pageSize);
	};

	const handleDelete = (record: SysRole) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除角色「${record.roleName}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				if (record.roleId === undefined) return;
				await removeRole(String(record.roleId));
				message.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? 10);
	};

	const columns: ColumnsType<SysRole> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: SysRole, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "名称",
			dataIndex: "roleName",
			key: "roleName",
			ellipsis: true,
		},
		{
			title: "角色描述",
			dataIndex: "remark",
			key: "remark",
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
			key: "menuCount",
			align: "center",
			render: (_: unknown, record) => formatPermissionCount(record),
		},
		{
			title: "创建时间",
			dataIndex: "createTime",
			key: "createTime",
			ellipsis: true,
		},
		{
			title: "操作",
			key: "actions",
			fixed: "right",
			render: (_: unknown, record: SysRole) => (
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
			),
		},
	];

	return (
		<div className={styles.permissionRole}>
			<div className={styles.toolbar}>
				<span className={styles.filterLabel}>角色名称</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入角色名称"
					value={roleName}
					allowClear
					onChange={(event) => setRoleName(event.target.value)}
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
						新增
					</Button>
				</div>
			</div>

			<Table
				size="small"
				columns={columns}
				dataSource={dataSource}
				rowKey="roleId"
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

			<AssignModal
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
