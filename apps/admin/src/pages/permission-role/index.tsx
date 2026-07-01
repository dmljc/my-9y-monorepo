import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useRef, useState } from "react";
import { create, list, remove, updatePermissions } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import PermissionAssignModal from "./PermissionAssignModal";
import type { Role, RoleFormValues } from "./utils";
import {
	formatPermissionCount,
	formatRoleCreatedAt,
	isSystemRole,
} from "./utils";

const PermissionRole = () => {
	const { message: showMsg, modal: confirmModal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<Role[]>([]);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [assigningRecord, setAssigningRecord] = useState<Role | null>(null);
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

	const handleReset = () => {
		setDraftName("");
		setAppliedName("");
		setPageNum(1);
		void loadData(1, pageSize, "");
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
		setCreateModalOpen(true);
	};

	const openAssign = (record: Role) => {
		setAssigningRecord(record);
		setAssignModalOpen(true);
	};

	const handleCreate = async (values: RoleFormValues) => {
		await create(values);
		showMsg.success("添加成功");
		await loadData(pageNum, pageSize);
	};

	const handleAssignPermissions = async (permissionIds: string[]) => {
		if (!assigningRecord) return;
		await updatePermissions(assigningRecord.id, permissionIds);
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
				try {
					await remove(record.id);
					showMsg.success("删除成功");
					await loadData(pageNum, pageSize);
				} catch {
					showMsg.error("系统角色不可删除");
				}
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
							onClick={() => openAssign(record)}
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
						<Button onClick={handleReset}>重置</Button>
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
						scroll={{ x: 1000 }}
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
				open={createModalOpen}
				existingRoles={dataSource}
				onCancel={() => setCreateModalOpen(false)}
				onOk={handleCreate}
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
