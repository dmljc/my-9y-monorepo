import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { User, UserFormValues, UserListFilters } from "./utils";
import {
	createUser,
	DEFAULT_PAGE_SIZE,
	fetchUserListResult,
	removeUser,
	updateUser,
} from "./utils";

const PermissionUser = () => {
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<User[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<User | null>(null);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [username, setUsername] = useState("");
	const [name, setName] = useState("");
	const initRef = useRef(false);

	const loadData = async (
		p: number,
		ps: number,
		filters?: UserListFilters,
	) => {
		setLoading(true);
		try {
			const result = await fetchUserListResult({
				pageNum: p,
				pageSize: ps,
				...(filters ?? {
					username: username.trim() || undefined,
					name: name.trim() || undefined,
				}),
			});
			setDataSource(result.list);
			setTotal(result.total);
			setPageNum(result.pageNum);
			setPageSize(result.pageSize);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		setPageNum(1);
		loadData(1, pageSize);
	};

	const handleReset = () => {
		setUsername("");
		setName("");
		setPageNum(1);
		loadData(1, pageSize, {});
	};

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

	const handleEdit = (record: User) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: UserFormValues) => {
		if (editingRecord) {
			await updateUser(editingRecord.id, values);
			message.success("编辑成功");
		} else {
			await createUser(values);
			message.success("新增成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleDelete = (record: User) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除用户「${record.name}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				await removeUser(record.id);
				message.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? pageSize);
	};

	const columns: ColumnsType<User> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: User, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "用户账号",
			dataIndex: "username",
			key: "username",
			ellipsis: true,
		},
		{
			title: "用户姓名",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
		},
		{
			title: "所属组织",
			dataIndex: "organizationName",
			key: "organizationName",
			ellipsis: true,
		},
		{
			title: "角色",
			dataIndex: "roleNames",
			key: "roleNames",
			ellipsis: true,
		},
		{
			title: "操作",
			key: "actions",
			fixed: "right",
			render: (_: unknown, record: User) => (
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
						onClick={() => handleDelete(record)}
					>
						删除
					</Button>
				</div>
			),
		},
	];

	return (
		<div className={styles.permissionUser}>
			<div className={styles.toolbar}>
				<span className={styles.filterLabel}>用户账号</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入用户账号"
					value={username}
					allowClear
					onChange={(event) => setUsername(event.target.value)}
					onPressEnter={handleSearch}
				/>
				<span className={styles.filterLabel}>用户姓名</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入用户姓名"
					value={name}
					allowClear
					onChange={(event) => setName(event.target.value)}
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
				rowKey="id"
				loading={loading}
				locale={{ emptyText: <Empty description="暂无用户" /> }}
				pagination={{
					current: pageNum,
					pageSize,
					total,
					showSizeChanger: true,
					pageSizeOptions: ["10", "15", "20", "50", "100"],
					showQuickJumper: true,
					showTotal: (count) => `共 ${count} 条`,
				}}
				onChange={handleTableChange}
			/>

			<CreateModal
				open={modalOpen}
				editingRecord={editingRecord}
				onCancel={() => {
					setModalOpen(false);
					setEditingRecord(null);
				}}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default PermissionUser;
