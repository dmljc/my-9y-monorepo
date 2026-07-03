import {
	DownloadOutlined,
	PlusOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Empty, Input, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import {
	create as createDept,
	list as fetchDeptList,
	remove as removeDept,
	update as updateDept,
} from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { SysDept } from "./interface";
import type { OrgFormValues, OrgTreeNode } from "./utils";
import {
	buildOrgTree,
	exportOrgsToJson,
	filterOrgTree,
	getAllOrgs,
	setFlatOrgsCache,
} from "./utils";

const PermissionOrganization = () => {
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<OrgTreeNode[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<OrgTreeNode | null>(
		null,
	);
	const [deptName, setDeptName] = useState("");
	const [searchKeyword, setSearchKeyword] = useState("");
	const initRef = useRef(false);

	const loadData = async (keyword = searchKeyword) => {
		setLoading(true);
		try {
			const data: SysDept[] = await fetchDeptList();
			const depts = data ?? [];
			setFlatOrgsCache(depts);
			setDataSource(filterOrgTree(buildOrgTree(depts), keyword));
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		const keyword = deptName.trim();
		setSearchKeyword(keyword);
		loadData(keyword);
	};

	const handleReset = () => {
		setDeptName("");
		setSearchKeyword("");
		loadData("");
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
		if (editingRecord?.deptId !== undefined) {
			await updateDept({ ...values, deptId: editingRecord.deptId });
			message.success("保存成功");
		} else {
			await createDept(values);
			message.success("添加成功");
		}
		await loadData();
	};

	const handleDelete = (record: OrgTreeNode) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除组织「${record.deptName}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				if (record.deptId === undefined) return;
				await removeDept(String(record.deptId));
				message.success("删除成功");
				await loadData();
			},
		});
	};

	const handleExport = () => {
		const depts = searchKeyword
			? getAllOrgs().filter((dept) =>
					dept.deptName?.includes(searchKeyword),
				)
			: getAllOrgs();
		if (depts.length === 0) {
			message.warning("暂无可导出的组织数据");
			return;
		}
		exportOrgsToJson(depts);
		message.success("导出成功");
	};

	const handleImport = () => {
		message.info("导入功能待对接后端");
	};

	const columns: ColumnsType<OrgTreeNode> = [
		{
			title: "组织名称",
			dataIndex: "deptName",
			key: "deptName",
			ellipsis: true,
		},
		{
			title: "描述",
			dataIndex: "remark",
			key: "remark",
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
					value={deptName}
					allowClear
					onChange={(event) => setDeptName(event.target.value)}
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
				rowKey="deptId"
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
