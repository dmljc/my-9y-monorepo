import { App, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import EditModal from "./EditModal";
import styles from "./index.module.css";
import {
	BUILDING_TABS,
	CONFIG_TYPE_OPTIONS,
	getPipelinesByBuilding,
	type PipelineConfigType,
	type PipelineFormValues,
	type PipelineItem,
	STATUS_LABEL,
} from "./utils";

const PipelineConfig = () => {
	const { message } = App.useApp();
	const pageRef = useRef<HTMLDivElement>(null);
	const [buildingKey, setBuildingKey] = useState(BUILDING_TABS[0].key);
	const [configType, setConfigType] = useState<PipelineConfigType>("room");
	const [pipelines, setPipelines] = useState<PipelineItem[]>(() =>
		getPipelinesByBuilding(BUILDING_TABS[0].key, "room"),
	);
	const [masterOn, setMasterOn] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<PipelineItem | null>(
		null,
	);

	useEffect(() => {
		setPipelines(getPipelinesByBuilding(buildingKey, configType));
	}, [buildingKey, configType]);

	const handleMasterChange = (checked: boolean) => {
		setMasterOn(checked);
		message.success(
			checked ? "“厂房名称”总开关已开启" : "“厂房名称”总开关已关闭",
		);
	};

	const handleAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	const handleEdit = (record: PipelineItem) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleSave = (record: PipelineItem) => {
		message.success(`“${record.deviceName}”已保存`);
	};

	const handleModalSubmit = async (values: PipelineFormValues) => {
		if (editingRecord) {
			setPipelines((prev) =>
				prev.map((item) =>
					item.id === editingRecord.id
						? {
								...item,
								deviceCode: values.deviceCode.trim(),
								deviceName: values.deviceName.trim(),
								sampleRoom: values.sampleRoom.trim(),
							}
						: item,
				),
			);
			message.success("编辑成功");
			return;
		}

		const newItem: PipelineItem = {
			id: `${buildingKey}-${configType}-${Date.now()}`,
			deviceCode: values.deviceCode.trim(),
			deviceName: values.deviceName.trim(),
			sampleRoom: values.sampleRoom.trim(),
			status: "closed",
			buildingKey,
			configType,
		};
		setPipelines((prev) => [newItem, ...prev]);
		message.success("新增成功");
	};

	const columns: ColumnsType<PipelineItem> = [
		{
			title: "设备编码",
			dataIndex: "deviceCode",
			key: "deviceCode",
			ellipsis: true,
		},
		{
			title: "设备名称",
			dataIndex: "deviceName",
			key: "deviceName",
			ellipsis: true,
		},
		{
			title: "取样房间号",
			dataIndex: "sampleRoom",
			key: "sampleRoom",
			ellipsis: true,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: "12%",
			render: (status: PipelineItem["status"]) => (
				<span
					className={
						status === "running"
							? styles.statusRunning
							: styles.statusClosed
					}
				>
					{STATUS_LABEL[status]}
				</span>
			),
		},
		{
			title: "操作",
			key: "actions",
			width: "14%",
			render: (_, record) => {
				if (record.status === "running") {
					return <span className={styles.actionDash}>—</span>;
				}
				return (
					<div className={styles.actions}>
						<button
							type="button"
							className={styles.actionBtn}
							onClick={() => handleEdit(record)}
						>
							编辑
						</button>
						<button
							type="button"
							className={styles.actionBtn}
							onClick={() => handleSave(record)}
						>
							保存
						</button>
					</div>
				);
			},
		},
	];

	return (
		<div
			ref={pageRef}
			className={styles.pipelineConfig}
			data-page="pipeline-config"
		>
			<BuildingPageHeader
				buildingKey={buildingKey}
				buildings={BUILDING_TABS}
				onBuildingChange={setBuildingKey}
				masterOn={masterOn}
				onMasterChange={handleMasterChange}
			/>

			<div className={styles.body}>
				<div className={styles.panel}>
					<div className={styles.panelHeader}>
						<div className={styles.segment} role="tablist">
							{CONFIG_TYPE_OPTIONS.map((item) => (
								<button
									key={item.key}
									type="button"
									role="tab"
									aria-selected={configType === item.key}
									className={`${styles.segmentItem} ${
										configType === item.key
											? styles.segmentItemActive
											: ""
									}`}
									onClick={() => setConfigType(item.key)}
								>
									{item.label}
								</button>
							))}
						</div>
						<button
							type="button"
							className={styles.addBtn}
							onClick={handleAdd}
						>
							<svg
								className={styles.addBtnPlus}
								viewBox="0 0 24 24"
								aria-hidden
							>
								<title>新增</title>
								<path
									d="M12 5v14M5 12h14"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
								/>
							</svg>
							<span>新增</span>
						</button>
					</div>
					<Table
						className={styles.table}
						columns={columns}
						dataSource={pipelines}
						rowKey="id"
						pagination={false}
						rowClassName={(_, index) =>
							index % 2 === 1 ? styles.rowStripe : ""
						}
					/>
				</div>
			</div>

			<EditModal
				open={modalOpen}
				editingRecord={editingRecord}
				getContainer={() => pageRef.current ?? document.body}
				onCancel={() => setModalOpen(false)}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default PipelineConfig;
