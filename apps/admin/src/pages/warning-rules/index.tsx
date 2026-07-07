import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Input, Switch, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import {
	create,
	list as fetchRuleList,
	listLevels,
	remove,
	update,
} from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import {
	buildRuleListResult,
	formatThresholdRange,
	type RuleFormValues,
	toAlarmRulePayload,
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
	const [pageSize, setPageSize] = useState(15);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [name, setName] = useState("");

	const loadData = async (p: number, ps: number, keyword = name) => {
		setLoading(true);
		try {
			const [data, levelData] = await Promise.all([
				fetchRuleList({
					pageNum: p,
					pageSize: ps,
					ruleName: keyword.trim(),
				}),
				listLevels(),
			]);
			const result = buildRuleListResult(data, levelData, p, ps);
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
		setName("");
		setPageNum(1);
		loadData(1, pageSize, "");
	};

	const initRef = useRef(false);
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

	const handleEdit = (record: WarningRule) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: RuleFormValues) => {
		const payload = toAlarmRulePayload(values, editingRecord?.id);
		if (editingRecord) {
			await update(payload);
			message.success("编辑成功");
		} else {
			await create(payload);
			message.success("新增成功");
		}
		await loadData(pageNum, pageSize);
	};

	const handleEnabledChange = async (
		record: WarningRule,
		enabled: boolean,
	) => {
		setTogglingId(record.id);
		try {
			await update(toAlarmRulePayload({ enabled }, record.id));
			message.success(enabled ? "已启用" : "已停用");
			await loadData(pageNum, pageSize);
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
			onOk: async () => {
				await remove(record.id);
				message.success("删除成功");
				await loadData(pageNum, pageSize);
			},
		});
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? pageSize);
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
			title: "所属房间",
			key: "roomNames",
			render: (_: unknown, record: WarningRule) => {
				const buildings = record.buildingNames.join("、");
				const rooms = record.roomNames.join("、");
				return [buildings, rooms].filter(Boolean).join(" / ");
			},
		},
		{
			title: "设备名称",
			key: "deviceNames",
			render: (_: unknown, record: WarningRule) =>
				record.deviceNames.join("、"),
			ellipsis: true,
		},
		{
			title: "物模型属性",
			key: "propertyKeys",
			render: (_: unknown, record: WarningRule) =>
				record.propertyKeys.join("、"),
			ellipsis: true,
		},
		{
			title: "报警阈值",
			key: "thresholdRange",
			render: (_: unknown, record: WarningRule) =>
				formatThresholdRange(record.thresholdMin, record.thresholdMax),
		},
		{
			title: "绑定等级",
			dataIndex: "levelName",
			key: "levelName",
			render: (_: unknown, record) => (
				<Tag color={record.levelColor || "processing"}>
					{record.levelName || "-"}
				</Tag>
			),
		},
		{
			title: "是否启用",
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
		<div className={styles.warningRules}>
			<div className={styles.filterBar}>
				<span className={styles.filterLabel}>规则名称</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入规则名称"
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
				locale={{
					emptyText: <Empty description="暂无报警规则" />,
				}}
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
				onCancel={() => setModalOpen(false)}
				onSubmit={handleModalSubmit}
			/>
		</div>
	);
};

export default WarningRules;
