import { Checkbox, Empty, Modal, Spin, Table, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { getAssignDetail } from "./api";
import type { RolePermissionDetailResponse, SysRole } from "./interface";
import type { AssignAction, AssignRow } from "./utils";
import {
	buildAssignRows,
	collectMenuIds,
	extractCheckedKeys,
	getActionKeys,
	hiddenIdsByPage,
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
	const [loading, setLoading] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [adminTableRows, setAdminTableRows] = useState<AssignRow[]>([]);
	const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
	const [hiddenMenuIdsByPage, setHiddenMenuIdsByPage] = useState<
		Record<string, number[]>
	>({});

	useEffect(() => {
		if (!open || role?.roleId === undefined) {
			setAdminTableRows([]);
			setCheckedKeys([]);
			setHiddenMenuIdsByPage({});
			return;
		}

		const loadDetail = async () => {
			setDetailLoading(true);
			try {
				const res: RolePermissionDetailResponse = await getAssignDetail(
					String(role.roleId),
				);
				const modules = res.modules ?? [];
				setAdminTableRows(buildAssignRows(modules));
				setCheckedKeys(extractCheckedKeys(modules));
				setHiddenMenuIdsByPage(hiddenIdsByPage(modules));
			} catch {
				// 加载失败时清空，避免展示过期权限；toast 由全局 onError 弹出
				setAdminTableRows([]);
				setCheckedKeys([]);
				setHiddenMenuIdsByPage({});
			} finally {
				setDetailLoading(false);
			}
		};

		loadDetail();
	}, [open, role]);

	const isPageChecked = (pageKey: string) => checkedKeys.includes(pageKey);

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

	const renderActionGroup = (record: AssignableRow) => {
		const pageChecked = isPageChecked(record.pageKey);

		return (
			<div
				style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px" }}
			>
				{record.actions.map((action) => (
					<Checkbox
						key={action.key}
						checked={checkedKeys.includes(action.key)}
						disabled={!pageChecked}
						onChange={(event) =>
							handleActionChange(
								record,
								action.key,
								event.target.checked,
							)
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

	const buildColumns = (rows: AssignRow[]): ColumnsType<AssignRow> => [
		{
			title: "功能模块",
			dataIndex: "moduleTitle",
			key: "moduleTitle",
			onCell: (record) => ({
				rowSpan: record.moduleRowSpan,
			}),
		},
		{
			title: "页面权限",
			key: "page",
			render: (_: unknown, record) => {
				const checked = isPageChecked(record.pageKey);
				return (
					<Checkbox
						checked={checked}
						onChange={(event) =>
							handlePageChange(record, event.target.checked, rows)
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
			render: (_: unknown, record) => renderActionGroup(record),
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
			width="60vw"
		>
			<Spin spinning={detailLoading}>
				<Tabs
					items={[
						{
							key: "admin",
							label: "后台管理",
							children: (
								<Table
									size="small"
									columns={buildColumns(adminTableRows)}
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
							disabled: true,
							children: (
								<Empty description="平板端权限暂未开放" />
							),
						},
					]}
				/>
			</Spin>
		</Modal>
	);
};

export default AssignModal;
