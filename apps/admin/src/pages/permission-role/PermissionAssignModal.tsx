import { App, Modal, Tree } from "antd";
import type { DataNode } from "antd/es/tree";
import { useEffect, useMemo, useState } from "react";
import type { Role } from "./utils";
import { ROLE_PERMISSION_TREE } from "./utils";

interface PermissionAssignModalProps {
	open: boolean;
	role: Role | null;
	onCancel: () => void;
	onOk: (permissionIds: string[]) => Promise<void>;
}

function toTreeData(nodes: typeof ROLE_PERMISSION_TREE): DataNode[] {
	return nodes.map((node) => ({
		key: node.key,
		title: node.title,
		children: node.children ? toTreeData(node.children) : undefined,
	}));
}

const PermissionAssignModal = ({
	open,
	role,
	onCancel,
	onOk,
}: PermissionAssignModalProps) => {
	const { message: showMsg } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

	const treeData = useMemo(() => toTreeData(ROLE_PERMISSION_TREE), []);

	useEffect(() => {
		if (!open || !role) return;
		setCheckedKeys(role.permissionIds);
	}, [open, role]);

	const handleOk = async () => {
		if (!role) return;
		setLoading(true);
		try {
			await onOk(checkedKeys);
			showMsg.success("权限分配成功");
			onCancel();
		} catch {
			showMsg.error("权限分配失败");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={`权限分配 - ${role?.name ?? ""}`}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width={560}
		>
			<Tree
				checkable
				defaultExpandAll
				treeData={treeData}
				checkedKeys={checkedKeys}
				onCheck={(keys) => {
					setCheckedKeys(
						Array.isArray(keys) ? (keys as string[]) : keys.checked,
					);
				}}
			/>
		</Modal>
	);
};

export default PermissionAssignModal;
