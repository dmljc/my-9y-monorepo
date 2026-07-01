import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Switch, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useRef, useState } from "react";
import { create, list, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import {
	formatThresholdRange,
	MONITOR_TYPE_LABEL,
	RULE_LEVEL_COLOR,
	RULE_LEVEL_LABEL,
	type RuleFormValues,
	type WarningRule,
} from "./utils";

const WarningRules = () => {
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<WarningRule[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<WarningRule | null>(
		null,
	);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [draftRuleName, setDraftRuleName] = useState("");
	const [appliedRuleName, setAppliedRuleName] = useState("");

	const loadData = useCallback(
		async (p: number, ps: number, ruleName = appliedRuleName) => {
			setLoading(true);
			try {
				const result = await list({
					pageNum: p,
					pageSize: ps,
					name: ruleName,
				});
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				message.error("加载报警规则失败");
			} finally {
				setLoading(false);
			}
		},
		[appliedRuleName, message],
	);

	const handleSearch = () => {
		const nextRuleName = draftRuleName.trim();
		setAppliedRuleName(nextRuleName);
		setPageNum(1);
		void loadData(1, pageSize, nextRuleName);
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

	const openEdit = (record: WarningRule) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: RuleFormValues) => {
		if (editingRecord) {
			await update(editingRecord.id, values);
			message.success("更新成功");
		} else {
			await create(values);
			message.success("创建成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleEnabledChange = async (
		record: WarningRule,
		enabled: boolean,
	) => {
		setTogglingId(record.id);
		try {
			await update(record.id, { enabled });
			message.success(enabled ? "已启用" : "已停用");
			await loadData(pageNum, pageSize);
		} catch {
			message.error("状态更新失败");
		} finally {
			setTogglingId(null);
		}
	};

	const handleDelete = (record: WarningRule) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除报警规则「${record.name}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			cancelText: "取消",
			onOk: async () => {
				await remove(record.id);
				message.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		void loadData(pagination.current ?? 1, pagination.pageSize ?? 10);
	};

	const columns: ColumnsType<WarningRule> = [
		{
			title: "序号",
			key: "index",
			width: 72,
			align: "center",
			render: (_: unknown, __: WarningRule, index: number) =>
				(pageNum - 1) * pageSize + index + 1,
		},
		{
			title: "规则名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
		},
		{
			title: "监控类型",
			dataIndex: "monitorType",
			key: "monitorType",
			render: (type: WarningRule["monitorType"]) => (
				<Tag color={type === "device" ? "blue" : "cyan"}>
					{MONITOR_TYPE_LABEL[type]}
				</Tag>
			),
		},
		{
			title: "设备名称",
			dataIndex: "targetName",
			key: "targetName",
			ellipsis: true,
		},
		{
			title: "物模型属性",
			dataIndex: "propertyKey",
			key: "propertyKey",
			ellipsis: true,
		},
		{
			title: "阈值范围",
			key: "thresholdRange",
			render: (_: unknown, record: WarningRule) =>
				formatThresholdRange(record.thresholdMin, record.thresholdMax),
		},
		{
			title: "等级",
			dataIndex: "level",
			key: "level",
			render: (level: WarningRule["level"]) => (
				<Tag color={RULE_LEVEL_COLOR[level]}>
					{RULE_LEVEL_LABEL[level]}
				</Tag>
			),
		},
		{
			title: "状态",
			dataIndex: "enabled",
			key: "enabled",
			render: (enabled: boolean, record: WarningRule) => (
				<div className={styles.statusCell}>
					<Switch
						size="small"
						checked={enabled}
						loading={togglingId === record.id}
						onChange={(checked) =>
							handleEnabledChange(record, checked)
						}
					/>
					<span className={styles.statusText}>
						{enabled ? "启用" : "停用"}
					</span>
				</div>
			),
		},
		{
			title: "操作",
			key: "actions",
			fixed: "right",
			render: (_: unknown, record: WarningRule) => (
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
		<div className={styles.warningRules}>
			<section className={styles.panel}>
				<header className={styles.panelHeader}>
					<div className={styles.filterBar}>
						<span className={styles.filterLabel}>规则名称</span>
						<Input
							className={styles.searchInput}
							placeholder="请输入规则名称"
							value={draftRuleName}
							allowClear
							onChange={(event) =>
								setDraftRuleName(event.target.value)
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
						新增规则
					</Button>
				</header>

				<div className={styles.tableWrap}>
					<Table
						size="small"
						className={styles.ruleTable}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={loading}
						scroll={{ x: 1100 }}
						locale={{
							emptyText: <Empty description="暂无报警规则" />,
						}}
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
				onSubmit={handleModalSubmit}
			/>
		</div>
	);
};

export default WarningRules;
