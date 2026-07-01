import {
	DownloadOutlined,
	PlusOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Empty, Input, Table, Upload } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { create, exportUsers, list, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { User, UserFormValues, UserListFilters } from "./utils";
import { exportUsersToJson } from "./utils";

const PermissionUser = () => {
	const { message: showMsg, modal: confirmModal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<User[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<User | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
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
			const result = await list({
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
			setSelectedRowKeys([]);
		} catch {
			showMsg.error("加载用户列表失败");
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
			await update(editingRecord.id, values);
			showMsg.success("保存成功");
		} else {
			await create(values);
			showMsg.success("添加成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleDelete = (record: User) => {
		confirmModal.confirm({
			title: "确认删除",
			content: `确定要删除用户「${record.name}」吗？`,
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

	const handleExport = () => {
		const data = exportUsers({
			username: username.trim() || undefined,
			name: name.trim() || undefined,
		});
		if (data.length === 0) {
			showMsg.warning("暂无可导出的用户数据");
			return;
		}
		exportUsersToJson(data);
		showMsg.success("导出成功");
	};

	const handleImport = () => {
		showMsg.info("导入功能待对接后端");
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? 10);
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
		<div className={styles.page}>
			<section className={styles.panel}>
				<header className={styles.panelHeader}>
					<div className={styles.filterBar}>
						<span className={styles.filterLabel}>用户账号</span>
						<Input
							className={styles.searchInput}
							placeholder="请输入用户账号"
							value={username}
							allowClear
							onChange={(event) =>
								setUsername(event.target.value)
							}
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
					</div>
					<div className={styles.panelActions}>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={handleAdd}
						>
							新增用户
						</Button>
						<Upload
							showUploadList={false}
							beforeUpload={() => {
								handleImport();
								return false;
							}}
						>
							<Button icon={<UploadOutlined />}>导入</Button>
						</Upload>
						<Button
							icon={<DownloadOutlined />}
							onClick={handleExport}
						>
							导出
						</Button>
					</div>
				</header>

				<div className={styles.tableWrap}>
					<Table
						size="middle"
						className={styles.table}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={loading}
						rowSelection={{
							selectedRowKeys,
							onChange: (keys) =>
								setSelectedRowKeys(keys as string[]),
						}}
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
				onCancel={() => setModalOpen(false)}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default PermissionUser;
