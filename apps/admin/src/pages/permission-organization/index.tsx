import {
	DownloadOutlined,
	PlusOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Empty, Input, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { OrgFormValues, OrgListFilters, OrgTreeNode } from "./utils";
import {
	create,
	exportOrgs,
	exportOrgsToJson,
	list,
	remove,
	update,
} from "./utils";

const PermissionOrganization = () => {
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<OrgTreeNode[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<OrgTreeNode | null>(
		null,
	);
	const [orgName, setOrgName] = useState("");
	const initRef = useRef(false);

	const loadData = async (filters?: OrgListFilters) => {
		setLoading(true);
		try {
			const result = await list(
				filters ?? { name: orgName.trim() || undefined },
			);
			setDataSource(result);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		loadData({ name: orgName.trim() || undefined });
	};

	const handleReset = () => {
		setOrgName("");
		loadData({});
	};

	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			loadData();
		}
	}, []);

	const handleAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	const handleEdit = (record: OrgTreeNode) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: OrgFormValues) => {
		try {
			if (editingRecord) {
				await update(editingRecord.id, values);
				message.success("保存成功");
			} else {
				await create(values);
				message.success("添加成功");
			}
			await loadData();
		} catch {
			throw new Error("submit failed");
		}
	};

	const handleDelete = (record: OrgTreeNode) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除组织「${record.name}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				await remove(record.id);
				message.success("删除成功");
				await loadData();
			},
		});
	};

	const handleExport = async () => {
		const data = await exportOrgs({
			name: orgName.trim() || undefined,
		});
		if (data.length === 0) {
			message.warning("暂无可导出的组织数据");
			return;
		}
		exportOrgsToJson(data);
		message.success("导出成功");
	};

	const handleImport = () => {
		message.info("导入功能待对接后端");
	};

	const columns: ColumnsType<OrgTreeNode> = [
		{
			title: "组织名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
		},
		{
			title: "描述",
			dataIndex: "description",
			key: "description",
			ellipsis: true,
		},
		{
			title: "操作",
			key: "actions",
			fixed: "right",
			render: (_: unknown, record: OrgTreeNode) => (
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
		<div className={styles.permissionOrganization}>
			<div className={styles.toolbar}>
				<span className={styles.filterLabel}>组织名称</span>
				<Input
					className={styles.searchInput}
					placeholder="请输入组织名称"
					value={orgName}
					allowClear
					onChange={(event) => setOrgName(event.target.value)}
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
						添加组织
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
					<Button icon={<DownloadOutlined />} onClick={handleExport}>
						导出
					</Button>
				</div>
			</div>

			<Table
				size="small"
				columns={columns}
				dataSource={dataSource}
				rowKey="id"
				loading={loading}
				pagination={false}
				expandable={{ defaultExpandAllRows: true }}
				locale={{ emptyText: <Empty description="暂无组织" /> }}
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

export default PermissionOrganization;
