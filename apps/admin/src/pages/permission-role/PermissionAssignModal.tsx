import { App, Checkbox, Modal, Table, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import type { PermissionAction, PermissionTableRow, Role } from "./utils";
import {
	buildPermissionTableRows,
	getPageActionKeys,
	getRoleCheckedMenuIds,
	normalizePermissionIds,
	TABLET_PERMISSION_MODULES,
} from "./utils";

interface PermissionAssignModalProps {
	open: boolean;
	role: Role | null;
	onCancel: () => void;
	onOk: (permissionIds: string[]) => Promise<void>;
}

interface AssignableRow {
	pageKey: string;
	actions: PermissionAction[];
}

const ADMIN_TABLE_ROWS = buildPermissionTableRows();
const TABLET_TABLE_ROWS = buildPermissionTableRows(TABLET_PERMISSION_MODULES);

const PermissionAssignModal = ({
	open,
	role,
	onCancel,
	onOk: onOkProp,
}: PermissionAssignModalProps) => {
	const { message } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

	useEffect(() => {
		if (!open || !role) return;

		const loadCheckedKeys = async () => {
			try {
				const menuIds = await getRoleCheckedMenuIds(role.id);
				setCheckedKeys(menuIds);
			} catch {
				message.error("加载角色权限失败");
			}
		};

		loadCheckedKeys();
	}, [open, role]);

	const isPageChecked = (pageKey: string) => checkedKeys.includes(pageKey);

	const updateCheckedKeys = (updater: (keys: Set<string>) => void) => {
		setCheckedKeys((prev) => {
			const next = new Set(prev);
			updater(next);
			return [...next];
		});
	};

	const handlePageChange = (record: AssignableRow, checked: boolean) => {
		updateCheckedKeys((keys) => {
			if (checked) {
				keys.add(record.pageKey);
				return;
			}

			keys.delete(record.pageKey);
			for (const actionKey of getPageActionKeys(record.pageKey)) {
				keys.delete(actionKey);
			}
		});
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
		setLoading(true);
		try {
			await onOkProp(normalizePermissionIds(checkedKeys));
			message.success("权限分配成功");
			onCancel();
		} catch {
			message.error("权限分配失败");
		} finally {
			setLoading(false);
		}
	};

	const columns: ColumnsType<PermissionTableRow> = [
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
							handlePageChange(record, event.target.checked)
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

	const renderPermissionTable = (rows: PermissionTableRow[]) => (
		<Table
			size="small"
			columns={columns}
			dataSource={rows}
			rowKey="rowKey"
			pagination={false}
			bordered
		/>
	);

	return (
		<Modal
			title={`权限分配 - ${role?.name ?? ""}`}
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width={920}
		>
			<Tabs
				items={[
					{
						key: "admin",
						label: "后台管理",
						children: renderPermissionTable(ADMIN_TABLE_ROWS),
					},
					{
						key: "tablet",
						label: "平板端",
						children: renderPermissionTable(TABLET_TABLE_ROWS),
					},
				]}
			/>
		</Modal>
	);
};

export default PermissionAssignModal;
