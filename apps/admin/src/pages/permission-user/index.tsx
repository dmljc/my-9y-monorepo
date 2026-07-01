import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useRef, useState } from "react";
import { create, list, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { User, UserFormValues, UserStatus } from "./utils";
import { USER_STATUS_COLOR, USER_STATUS_LABEL } from "./utils";

const PermissionUser = () => {
	const { message: showMsg, modal: confirmModal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<User[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<User | null>(null);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [draftUsername, setDraftUsername] = useState("");
	const [appliedUsername, setAppliedUsername] = useState("");

	const loadData = useCallback(
		async (p: number, ps: number, username = appliedUsername) => {
			setLoading(true);
			try {
				const result = await list({
					pageNum: p,
					pageSize: ps,
					username,
				});
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				showMsg.error("加载用户列表失败");
			} finally {
				setLoading(false);
			}
		},
		[appliedUsername, showMsg],
	);

	const handleSearch = () => {
		const nextUsername = draftUsername.trim();
		setAppliedUsername(nextUsername);
		setPageNum(1);
		void loadData(1, pageSize, nextUsername);
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

	const openEdit = (record: User) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: UserFormValues) => {
		if (editingRecord) {
			await update(editingRecord.id, values);
			showMsg.success("更新成功");
		} else {
			await create(values);
			showMsg.success("创建成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleDelete = (record: User) => {
		confirmModal.confirm({
			title: "确认删除",
			content: `确定要删除用户「${record.realName}」吗？`,
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
			title: "用户名",
			dataIndex: "username",
			key: "username",
			ellipsis: true,
		},
		{
			title: "真实姓名",
			dataIndex: "realName",
			key: "realName",
			ellipsis: true,
		},
		{
			title: "所属角色",
			dataIndex: "roleName",
			key: "roleName",
			ellipsis: true,
		},
		{
			title: "手机号",
			dataIndex: "phone",
			key: "phone",
		},
		{
			title: "邮箱",
			dataIndex: "email",
			key: "email",
			ellipsis: true,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 80,
			render: (status: UserStatus) => (
				<Tag color={USER_STATUS_COLOR[status]}>
					{USER_STATUS_LABEL[status]}
				</Tag>
			),
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
			render: (_: unknown, record: User) => (
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
						<span className={styles.filterLabel}>用户名</span>
						<Input
							className={styles.searchInput}
							placeholder="请输入用户名"
							value={draftUsername}
							allowClear
							onChange={(event) =>
								setDraftUsername(event.target.value)
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
						新增用户
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
						scroll={{ x: 1100 }}
						locale={{ emptyText: <Empty description="暂无用户" /> }}
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
				existingUsers={dataSource}
				onCancel={() => setModalOpen(false)}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default PermissionUser;
