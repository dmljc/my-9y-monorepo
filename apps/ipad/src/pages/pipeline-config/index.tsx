import { App, Input, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import EditModal from "./EditModal";
import { MAX_LENGTH_40 } from "./formRules";
import styles from "./index.module.css";
import {
	BUILDING_TABS,
	CONFIG_TYPE_OPTIONS,
	getPipelinesByBuilding,
	type PipelineConfigType,
	type PipelineFormValues,
	type PipelineItem,
	STATUS_LABEL,
	sanitizePipeInInput,
	validateRoomPipeIn,
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
	/** 房间管道配置：行级管道号错误文案。 */
	const [pipeInErrors, setPipeInErrors] = useState<Record<string, string>>(
		{},
	);

	useEffect(() => {
		setPipelines(getPipelinesByBuilding(buildingKey, configType));
		setPipeInErrors({});
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

	const handlePipeInChange = (id: string, raw: string) => {
		const pipeIn = sanitizePipeInInput(raw);
		setPipelines((prev) =>
			prev.map((item) => (item.id === id ? { ...item, pipeIn } : item)),
		);
		setPipeInErrors((prev) => {
			if (!prev[id]) return prev;
			const next = { ...prev };
			delete next[id];
			return next;
		});
	};

	const handleSave = (record: PipelineItem) => {
		if (configType === "room") {
			const error = validateRoomPipeIn(
				record.pipeIn,
				record.id,
				pipelines,
			);
			if (error) {
				setPipeInErrors((prev) => ({ ...prev, [record.id]: error }));
				return;
			}
			setPipeInErrors((prev) => {
				const next = { ...prev };
				delete next[record.id];
				return next;
			});
			message.success("保存成功");
			return;
		}
		message.success(`“${record.deviceName}”已保存`);
	};

	const handleModalSubmit = async (
		values: PipelineFormValues,
	): Promise<boolean | undefined> => {
		if (configType === "room") {
			const sampleRoom = values.sampleRoom.trim();
			const pipeIn = sanitizePipeInInput(values.pipeIn);
			const tempId = editingRecord?.id ?? "__new__";
			const error = validateRoomPipeIn(pipeIn, tempId, pipelines);
			if (error) {
				message.error(error);
				return false;
			}
			if (editingRecord) {
				setPipelines((prev) =>
					prev.map((item) =>
						item.id === editingRecord.id
							? { ...item, sampleRoom, pipeIn }
							: item,
					),
				);
				message.success("编辑成功");
				return;
			}
			const newItem: PipelineItem = {
				id: `${buildingKey}-room-${Date.now()}`,
				deviceCode: "",
				deviceName: "",
				sampleRoom,
				pipeIn,
				status: "closed",
				buildingKey,
				configType,
			};
			setPipelines((prev) => [newItem, ...prev]);
			message.success("新增成功");
			return;
		}

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
			pipeIn: "",
			status: "closed",
			buildingKey,
			configType,
		};
		setPipelines((prev) => [newItem, ...prev]);
		message.success("新增成功");
	};

	const roomColumns: ColumnsType<PipelineItem> = [
		{
			title: "房间号",
			dataIndex: "sampleRoom",
			key: "sampleRoom",
			ellipsis: true,
		},
		{
			title: "管道号（IN）",
			dataIndex: "pipeIn",
			key: "pipeIn",
			render: (pipeIn: string, record) => {
				const error = pipeInErrors[record.id];
				return (
					<div className={styles.pipeInCell}>
						<Input
							className={`${styles.pipeInInput} ${error ? styles.pipeInInputError : ""}`}
							value={pipeIn}
							status={error ? "error" : undefined}
							maxLength={MAX_LENGTH_40}
							inputMode="numeric"
							placeholder="请输入管道号"
							onChange={(e) =>
								handlePipeInChange(record.id, e.target.value)
							}
						/>
						{error ? (
							<span className={styles.pipeInError}>{error}</span>
						) : null}
					</div>
				);
			},
		},
		{
			title: "操作",
			key: "actions",
			width: "14%",
			render: (_, record) => (
				<button
					type="button"
					className={styles.saveBtn}
					onClick={() => handleSave(record)}
				>
					保存
				</button>
			),
		},
	];

	const deviceColumns: ColumnsType<PipelineItem> = [
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

	const columns = configType === "room" ? roomColumns : deviceColumns;

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
				configType={configType}
				editingRecord={editingRecord}
				getContainer={() => pageRef.current ?? document.body}
				onCancel={() => setModalOpen(false)}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default PipelineConfig;
