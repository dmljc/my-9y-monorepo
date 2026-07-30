import { App, Checkbox, Modal, Spin, Table, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { getAssignDetail } from "./api";
import type { SysRole } from "./interface";
import type { AssignAction, AssignRow } from "./utils";
import {
	buildAllHiddenIdsByPage,
	buildAssignRows,
	collectMenuIds,
	extractCheckedKeys,
	getActionKeys,
	hiddenIdsByPage,
	parseAssignDetailResponse,
	TABLET_PERMISSION_MODULES,
} from "./utils";

interface AssignModalProps {
	open: boolean;
	role: SysRole | null;
	onCancel: () => void;
	onOk: (menuIds: number[]) => Promise<void>;
}

interface AssignableRow {
	pageKey: string;
	actions: AssignAction[];
}

const AssignModal = ({
	open,
	role,
	onCancel,
	onOk: onOkProp,
}: AssignModalProps) => {
	const { message } = App.useApp();
	const tabletTableRows = buildAssignRows(TABLET_PERMISSION_MODULES);
	const [loading, setLoading] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [activePermissionTab, setActivePermissionTab] = useState("admin");
	const [adminTableRows, setAdminTableRows] = useState<AssignRow[]>([]);
	const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
	const [tabletCheckedKeys, setTabletCheckedKeys] = useState<string[]>(() =>
		extractCheckedKeys(TABLET_PERMISSION_MODULES),
	);
	const [hiddenMenuIdsByPage, setHiddenMenuIdsByPage] = useState<
		Record<string, number[]>
	>({});
	const [allHiddenIdsByPage, setAllHiddenIdsByPage] = useState<
		Record<string, number[]>
	>({});

	useEffect(() => {
		if (!open || role?.roleId === undefined) {
			setAdminTableRows([]);
			setCheckedKeys([]);
			setTabletCheckedKeys(extractCheckedKeys(TABLET_PERMISSION_MODULES));
			setActivePermissionTab("admin");
			setHiddenMenuIdsByPage({});
			setAllHiddenIdsByPage({});
			return;
		}

		const roleId = role.roleId;
		const roleMenuIds = role.menuIds ?? [];
		let cancelled = false;

		const loadDetail = async () => {
			setDetailLoading(true);
			try {
				const res = await getAssignDetail(String(roleId));
				if (cancelled) return;

				const { modules, assignedMenuIds } = parseAssignDetailResponse(
					res,
					roleMenuIds,
				);
				setAdminTableRows(buildAssignRows(modules));
				setCheckedKeys(extractCheckedKeys(modules, assignedMenuIds));
				setHiddenMenuIdsByPage(
					hiddenIdsByPage(modules, assignedMenuIds),
				);
				setAllHiddenIdsByPage(buildAllHiddenIdsByPage(modules));
			} catch {
				if (cancelled) return;
				// 加载失败时清空，避免展示过期权限；toast 由全局 onError 弹出
				setAdminTableRows([]);
				setCheckedKeys([]);
				setHiddenMenuIdsByPage({});
				setAllHiddenIdsByPage({});
			} finally {
				if (!cancelled) {
					setDetailLoading(false);
				}
			}
		};

		loadDetail();

		return () => {
			cancelled = true;
		};
	}, [open, role?.roleId, role?.menuIds]);

	const updateCheckedKeys = (updater: (keys: Set<string>) => void) => {
		setCheckedKeys((prev) => {
			const next = new Set(prev);
			updater(next);
			return [...next];
		});
	};

	const handlePageChange = (
		record: AssignableRow,
		checked: boolean,
		rows: AssignRow[],
	) => {
		updateCheckedKeys((keys) => {
			if (checked) {
				keys.add(record.pageKey);
				return;
			}

			keys.delete(record.pageKey);
			for (const actionKey of getActionKeys(record.pageKey, rows)) {
				keys.delete(actionKey);
			}
		});

		if (checked) {
			const hiddenIds = allHiddenIdsByPage[record.pageKey];
			if (hiddenIds?.length) {
				setHiddenMenuIdsByPage((prev) => ({
					...prev,
					[record.pageKey]: hiddenIds,
				}));
			}
			return;
		}

		if (!checked) {
			setHiddenMenuIdsByPage((prev) => {
				if (!(record.pageKey in prev)) return prev;
				const next = { ...prev };
				delete next[record.pageKey];
				return next;
			});
		}
	};

	const handleActionChange = (
		record: AssignableRow,
		actionKey: string,
		checked: boolean,
	) => {
		updateCheckedKeys((keys) => {
			if (checked) {
				keys.add(record.pageKey);
				keys.add(actionKey);
				return;
			}
			keys.delete(actionKey);
		});
	};

	const handleTabletPageChange = (
		record: AssignableRow,
		checked: boolean,
	) => {
		setTabletCheckedKeys((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(record.pageKey);
			} else {
				next.delete(record.pageKey);
				for (const actionKey of getActionKeys(
					record.pageKey,
					tabletTableRows,
				)) {
					next.delete(actionKey);
				}
			}
			return [...next];
		});
	};

	const handleTabletActionChange = (
		record: AssignableRow,
		actionKey: string,
		checked: boolean,
	) => {
		setTabletCheckedKeys((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(record.pageKey);
				next.add(actionKey);
			} else {
				next.delete(actionKey);
			}
			return [...next];
		});
	};

	const renderActionGroup = (
		record: AssignableRow,
		keys: string[],
		onChange: (
			record: AssignableRow,
			actionKey: string,
			checked: boolean,
		) => void,
	) => {
		const pageChecked = keys.includes(record.pageKey);

		return (
			<div
				style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px" }}
			>
				{record.actions.map((action) => (
					<Checkbox
						key={action.key}
						checked={keys.includes(action.key)}
						disabled={!pageChecked}
						onChange={(event) =>
							onChange(record, action.key, event.target.checked)
						}
					>
						{action.title}
					</Checkbox>
				))}
			</div>
		);
	};

	const onOk = async () => {
		if (!role) return;
		if (activePermissionTab === "tablet") {
			message.info("平板端权限为模拟数据，暂不支持保存");
			return;
		}
		try {
			setLoading(true);
			const menuIds = collectMenuIds(
				checkedKeys,
				adminTableRows,
				hiddenMenuIdsByPage,
			);
			await onOkProp(menuIds);
			onCancel();
		} catch {
			// 接口失败；toast 由全局 onError 处理
		} finally {
			setLoading(false);
		}
	};

	const buildColumns = (
		rows: AssignRow[],
		keys: string[],
		onPageChange: (
			record: AssignableRow,
			checked: boolean,
			rows: AssignRow[],
		) => void,
		onActionChange: (
			record: AssignableRow,
			actionKey: string,
			checked: boolean,
		) => void,
		scopeTitle = "页面权限",
	): ColumnsType<AssignRow> => [
		{
			title: "功能模块",
			dataIndex: "moduleTitle",
			key: "moduleTitle",
			onCell: (record) => ({
				rowSpan: record.moduleRowSpan,
			}),
		},
		{
			title: scopeTitle,
			key: "page",
			render: (_: unknown, record) => {
				const checked = keys.includes(record.pageKey);
				return (
					<Checkbox
						checked={checked}
						onChange={(event) =>
							onPageChange(record, event.target.checked, rows)
						}
					>
						{record.pageTitle}
					</Checkbox>
				);
			},
		},
		{
			title: "按钮权限",
			key: "actions",
			render: (_: unknown, record) =>
				renderActionGroup(record, keys, onActionChange),
		},
	];

	return (
		<Modal
			title={`权限分配 - ${role?.roleName ?? ""}`}
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width="35vw"
		>
			<Spin spinning={detailLoading}>
				<Tabs
					activeKey={activePermissionTab}
					onChange={setActivePermissionTab}
					items={[
						{
							key: "admin",
							label: "后台管理",
							children: (
								<Table
									size="small"
									columns={buildColumns(
										adminTableRows,
										checkedKeys,
										handlePageChange,
										handleActionChange,
									)}
									dataSource={adminTableRows}
									rowKey="rowKey"
									pagination={false}
									bordered
								/>
							),
						},
						{
							key: "tablet",
							label: "平板端",
							children: (
								<Table
									size="small"
									columns={buildColumns(
										tabletTableRows,
										tabletCheckedKeys,
										handleTabletPageChange,
										handleTabletActionChange,
										"厂房权限",
									)}
									dataSource={tabletTableRows}
									rowKey="rowKey"
									pagination={false}
									bordered
								/>
							),
						},
					]}
				/>
			</Spin>
		</Modal>
	);
};

export default AssignModal;
