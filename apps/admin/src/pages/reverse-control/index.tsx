import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Switch, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { changeStatus, create, list, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { IiotControlRule } from "./interface";
import type { RuleFormValues } from "./types";
import { isEnabled, toRule, toStatus } from "./utils";

const ReverseControl = () => {
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<IiotControlRule[]>([]);
	const [ruleName, setRuleName] = useState("");
	const [searchKeyword, setSearchKeyword] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<IiotControlRule | null>(
		null,
	);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(15);
	const [togglingId, setTogglingId] = useState<number | null>(null);
	const initRef = useRef(false);

	const loadData = async (p: number, ps: number, keyword = searchKeyword) => {
		setLoading(true);
		try {
			const data = await list({
				pageNum: p,
				pageSize: ps,
				ruleName: keyword.trim() || undefined,
			});
			setDataSource(data.list ?? []);
			setTotal(data.total ?? 0);
			setPageNum(data.pageNum ?? p);
			setPageSize(data.pageSize ?? ps);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		const keyword = ruleName.trim();
		setSearchKeyword(keyword);
		setPageNum(1);
		loadData(1, pageSize, keyword);
	};

	const handleReset = () => {
		setRuleName("");
		setSearchKeyword("");
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
		setModalOpen(true);
	};

	const handleEdit = (record: IiotControlRule) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: RuleFormValues) => {
		if (editingRecord?.id !== undefined) {
			await update(toRule(values, editingRecord.id));
			message.success("编辑成功");
		} else {
			await create(toRule(values));
			message.success("新增成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleEnabledChange = async (
		record: IiotControlRule,
		enabled: boolean,
	) => {
		if (record.id === undefined) return;
		setTogglingId(record.id);
		try {
			await changeStatus({
				id: record.id,
				status: toStatus(enabled),
			});
			setDataSource((prev) =>
				prev.map((item) =>
					item.id === record.id
						? { ...item, status: toStatus(enabled) }
						: item,
				),
			);
			message.success(enabled ? "已启用" : "已停用");
		} finally {
			setTogglingId(null);
		}
	};

	const handleDelete = (record: IiotControlRule) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除反控规则「${record.ruleName}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				if (record.id === undefined) return;
				await remove(String(record.id));
				message.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		const nextPage = pagination.current ?? 1;
		const nextSize = pagination.pageSize ?? pageSize;
		setPageNum(nextPage);
		setPageSize(nextSize);
		loadData(nextPage, nextSize);
	};

	const columns: ColumnsType<IiotControlRule> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: IiotControlRule, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "反控规则名称",
			dataIndex: "ruleName",
			key: "ruleName",
			ellipsis: true,
		},
		{
			title: "规则描述",
			dataIndex: "description",
			key: "description",
			ellipsis: true,
		},
		{
			title: "累计触发",
			dataIndex: "triggerCount",
			key: "triggerCount",
			align: "center",
		},
		{
			title: "启停用",
			key: "enabled",
			align: "center",
			render: (_: unknown, record) => (
				<Switch
					size="small"
					checked={isEnabled(record.status)}
					loading={togglingId === record.id}
					onChange={(checked) => handleEnabledChange(record, checked)}
				/>
			),
		},
		{
			title: "操作",
			key: "actions",
			align: "center",
			render: (_: unknown, record) => (
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
		<div className={styles.reverseControl}>
			<div className={styles.toolbar}>
				<span className={styles.filterLabel}>反控规则名称</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入规则名称"
					value={ruleName}
					allowClear
					onChange={(event) => setRuleName(event.target.value)}
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
				loading={loading}
				columns={columns}
				dataSource={dataSource}
				rowKey="id"
				locale={{
					emptyText: <Empty description="暂无反控规则" />,
				}}
				pagination={{
					current: pageNum,
					pageSize,
					total,
					showSizeChanger: true,
					pageSizeOptions: ["10", "15", "20", "50", "100"],
					showQuickJumper: true,
					showTotal: (count: number) => `共 ${count} 条`,
				}}
				onChange={handleTableChange}
			/>

			<CreateModal
				open={modalOpen}
				editingRecord={editingRecord}
				onCancel={() => setModalOpen(false)}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default ReverseControl;
