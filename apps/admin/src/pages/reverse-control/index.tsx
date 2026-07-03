import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Switch, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useMemo, useState } from "react";
import CreateRuleModal from "./CreateModal";
import styles from "./index.module.css";
import type { ReverseControlRule, RuleFormValues } from "./types";
import { filterRules, MOCK_RULES } from "./utils";

const ReverseControl = () => {
	const { message, modal } = App.useApp();
	const [rules, setRules] = useState<ReverseControlRule[]>(MOCK_RULES);
	const [draftDeviceName, setDraftDeviceName] = useState("");
	const [appliedDeviceName, setAppliedDeviceName] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] =
		useState<ReverseControlRule | null>(null);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const filteredRules = useMemo(
		() => filterRules(rules, appliedDeviceName),
		[appliedDeviceName, rules],
	);

	const pagedRules = useMemo(() => {
		const start = (pageNum - 1) * pageSize;
		return filteredRules.slice(start, start + pageSize);
	}, [filteredRules, pageNum, pageSize]);

	const handleSearch = () => {
		setAppliedDeviceName(draftDeviceName.trim());
		setPageNum(1);
	};

	const openAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	const openEdit = (record: ReverseControlRule) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalOk = (values: RuleFormValues) => {
		if (editingRecord) {
			setRules((prev) =>
				prev.map((rule) =>
					rule.id === editingRecord.id
						? {
								...rule,
								name: values.name,
								description: values.description,
								conditionRelation: values.conditionRelation,
								conditions: values.conditions,
								actions: values.actions,
								enabled: values.enabled,
							}
						: rule,
				),
			);
			message.success("更新成功");
		} else {
			setRules((prev) => [
				{
					id: String(Date.now()),
					name: values.name,
					description: values.description,
					conditionRelation: values.conditionRelation,
					conditions: values.conditions,
					actions: values.actions,
					triggerCount: 0,
					enabled: values.enabled,
				},
				...prev,
			]);
			message.success("新增成功");
		}
	};

	const handleEnabledChange = (
		record: ReverseControlRule,
		enabled: boolean,
	) => {
		setRules((prev) =>
			prev.map((rule) =>
				rule.id === record.id ? { ...rule, enabled } : rule,
			),
		);
		message.success(enabled ? "已启用" : "已停用");
	};

	const handleDelete = (record: ReverseControlRule) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除反控规则「${record.name}」吗？`,
			okButtonProps: { danger: true },
			onOk: async () => {
				setRules((prev) =>
					prev.filter((rule) => rule.id !== record.id),
				);
				message.success("删除成功");
			},
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		setPageNum(pagination.current ?? 1);
		setPageSize(pagination.pageSize ?? 10);
	};

	const columns: ColumnsType<ReverseControlRule> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: ReverseControlRule, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "反控规则名称",
			dataIndex: "name",
			key: "name",
		},
		{
			title: "规则描述",
			key: "description",
			ellipsis: true,
			render: (_: unknown, record) => record.description,
		},
		{
			title: "累计触发",
			dataIndex: "triggerCount",
			key: "triggerCount",
			align: "center",
		},
		{
			title: "启停用",
			dataIndex: "enabled",
			key: "enabled",
			align: "center",
			render: (enabled: boolean, record) => (
				<Switch
					size="small"
					checked={enabled}
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
		<div className={styles.reverseControl}>
			<section className={styles.panel}>
				<header className={styles.panelHeader}>
					<div className={styles.filterBar}>
						<span className={styles.filterLabel}>设备名称</span>
						<Input
							className={styles.searchInput}
							placeholder="请输入设备名称"
							value={draftDeviceName}
							allowClear
							onChange={(event) =>
								setDraftDeviceName(event.target.value)
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
						新增
					</Button>
				</header>

				<div className={styles.tableWrap}>
					<Table
						size="small"
						className={styles.ruleTable}
						columns={columns}
						dataSource={pagedRules}
						rowKey="id"
						locale={{
							emptyText: <Empty description="暂无反控规则" />,
						}}
						pagination={{
							current: pageNum,
							pageSize,
							total: filteredRules.length,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (count: number) => `共 ${count} 条`,
						}}
						onChange={handleTableChange}
					/>
				</div>
			</section>

			<CreateRuleModal
				open={modalOpen}
				editingRecord={editingRecord}
				existingRules={rules}
				onCancel={() => setModalOpen(false)}
				onOk={handleModalOk}
			/>
		</div>
	);
};

export default ReverseControl;
