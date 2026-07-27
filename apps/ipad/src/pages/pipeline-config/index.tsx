import { App, Input, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import {
	BUILDING_TABS,
	CONFIG_TYPE_OPTIONS,
	FLOW_RATE_REQUIRED_MSG,
	getPipelinesByBuilding,
	MAX_LENGTH_40,
	PIPE_NO_REQUIRED_MSG,
	type PipelineConfigType,
	type PipelineFormValues,
	type PipelineItem,
	sanitizeFlowRateInput,
	sanitizePipeNoInput,
	validateDevicePipeOut,
	validateFlowRate,
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
	/** 行级管道号错误文案（房间 IN / 设备 OUT）。 */
	const [pipeNoErrors, setPipeNoErrors] = useState<Record<string, string>>(
		{},
	);
	/** 设备配置：行级流量错误文案。 */
	const [flowRateErrors, setFlowRateErrors] = useState<
		Record<string, string>
	>({});

	const clearFieldError = (
		setter: Dispatch<SetStateAction<Record<string, string>>>,
		id: string,
	) => {
		setter((prev) => {
			if (!prev[id]) return prev;
			const next = { ...prev };
			delete next[id];
			return next;
		});
	};

	/** 切换厂房 / 配置类型时同步换表数据，避免列先变、数据后到造成表格跳动。 */
	const resetList = (
		nextBuildingKey: string,
		nextConfigType: PipelineConfigType,
	) => {
		setPipelines(getPipelinesByBuilding(nextBuildingKey, nextConfigType));
		setPipeNoErrors({});
		setFlowRateErrors({});
	};

	const handleBuildingChange = (key: string) => {
		setBuildingKey(key);
		resetList(key, configType);
	};

	const handleConfigTypeChange = (key: PipelineConfigType) => {
		setConfigType(key);
		resetList(buildingKey, key);
	};

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

	const handlePipeInChange = (id: string, raw: string) => {
		const pipeIn = sanitizePipeNoInput(raw);
		setPipelines((prev) =>
			prev.map((item) => (item.id === id ? { ...item, pipeIn } : item)),
		);
		clearFieldError(setPipeNoErrors, id);
	};

	const handlePipeOutChange = (id: string, raw: string) => {
		const pipeOut = sanitizePipeNoInput(raw);
		setPipelines((prev) =>
			prev.map((item) => (item.id === id ? { ...item, pipeOut } : item)),
		);
		clearFieldError(setPipeNoErrors, id);
	};

	const handleFlowRateChange = (id: string, raw: string) => {
		const flowRate = sanitizeFlowRateInput(raw);
		setPipelines((prev) =>
			prev.map((item) => (item.id === id ? { ...item, flowRate } : item)),
		);
		clearFieldError(setFlowRateErrors, id);
	};

	const handleSave = (record: PipelineItem) => {
		if (configType === "room") {
			const error = validateRoomPipeIn(
				record.pipeIn,
				record.id,
				pipelines,
			);
			if (error) {
				setPipeNoErrors((prev) => ({ ...prev, [record.id]: error }));
				return;
			}
			clearFieldError(setPipeNoErrors, record.id);
			message.success("保存成功");
			return;
		}

		const pipeError = validateDevicePipeOut(
			record.pipeOut,
			record.id,
			pipelines,
		);
		const flowError = validateFlowRate(record.flowRate);
		if (pipeError || flowError) {
			if (pipeError) {
				setPipeNoErrors((prev) => ({
					...prev,
					[record.id]: pipeError,
				}));
			} else {
				clearFieldError(setPipeNoErrors, record.id);
			}
			if (flowError) {
				setFlowRateErrors((prev) => ({
					...prev,
					[record.id]: flowError,
				}));
			} else {
				clearFieldError(setFlowRateErrors, record.id);
			}
			return;
		}
		clearFieldError(setPipeNoErrors, record.id);
		clearFieldError(setFlowRateErrors, record.id);
		message.success("保存成功");
	};

	const handleModalSubmit = async (
		values: PipelineFormValues,
	): Promise<boolean | undefined> => {
		if (configType === "room") {
			const sampleRoom = values.sampleRoom.trim();
			const pipeIn = sanitizePipeNoInput(values.pipeIn ?? "");
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
				pipeOut: "",
				flowRate: "",
				status: "closed",
				buildingKey,
				configType,
			};
			setPipelines((prev) => [newItem, ...prev]);
			message.success("新增成功");
			return;
		}

		const deviceCode = values.deviceCode.trim();
		const deviceName = values.deviceName.trim();
		const pipeOut = sanitizePipeNoInput(values.pipeOut ?? "");
		const flowRate = sanitizeFlowRateInput(values.flowRate ?? "");
		const tempId = editingRecord?.id ?? "__new__";
		const pipeError = validateDevicePipeOut(pipeOut, tempId, pipelines);
		const flowError = validateFlowRate(flowRate);
		if (pipeError || flowError) {
			message.error(pipeError || flowError);
			return false;
		}

		if (editingRecord) {
			setPipelines((prev) =>
				prev.map((item) =>
					item.id === editingRecord.id
						? {
								...item,
								deviceCode,
								deviceName,
								pipeOut,
								flowRate,
							}
						: item,
				),
			);
			message.success("编辑成功");
			return;
		}

		const newItem: PipelineItem = {
			id: `${buildingKey}-device-${Date.now()}`,
			deviceCode,
			deviceName,
			sampleRoom: "",
			pipeIn: "",
			pipeOut,
			flowRate,
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
				const error = pipeNoErrors[record.id];
				const requiredError = error === PIPE_NO_REQUIRED_MSG;
				const sideError = error && !requiredError ? error : "";
				return (
					<div className={styles.pipeFieldCell}>
						<Input
							className={`${styles.pipeFieldInput} ${error ? styles.pipeFieldInputError : ""}`}
							value={pipeIn}
							status={error ? "error" : undefined}
							maxLength={MAX_LENGTH_40}
							inputMode="numeric"
							placeholder={
								requiredError
									? PIPE_NO_REQUIRED_MSG
									: "请输入管道号"
							}
							onChange={(e) =>
								handlePipeInChange(record.id, e.target.value)
							}
						/>
						{sideError ? (
							<span className={styles.pipeFieldError}>
								{sideError}
							</span>
						) : null}
					</div>
				);
			},
		},
		{
			title: "操作",
			key: "actions",
			width: "10%",
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
			title: "管道号（OUT）",
			dataIndex: "pipeOut",
			key: "pipeOut",
			render: (pipeOut: string, record) => {
				const error = pipeNoErrors[record.id];
				const requiredError = error === PIPE_NO_REQUIRED_MSG;
				const sideError = error && !requiredError ? error : "";
				return (
					<div
						className={`${styles.pipeFieldCell} ${styles.pipeOutCell}`}
					>
						<Input
							className={`${styles.pipeFieldInput} ${styles.pipeOutInput} ${error ? styles.pipeFieldInputError : ""}`}
							value={pipeOut}
							status={error ? "error" : undefined}
							maxLength={MAX_LENGTH_40}
							inputMode="numeric"
							placeholder={
								requiredError
									? PIPE_NO_REQUIRED_MSG
									: "请输入管道号"
							}
							onChange={(e) =>
								handlePipeOutChange(record.id, e.target.value)
							}
						/>
						{sideError ? (
							<span className={styles.pipeFieldError}>
								{sideError}
							</span>
						) : null}
					</div>
				);
			},
		},
		{
			title: "流量（L/min）",
			dataIndex: "flowRate",
			key: "flowRate",
			render: (flowRate: string, record) => {
				const error = flowRateErrors[record.id];
				const requiredError = error === FLOW_RATE_REQUIRED_MSG;
				const sideError = error && !requiredError ? error : "";
				return (
					<div className={styles.pipeFieldCell}>
						<Input
							className={`${styles.pipeFieldInput} ${styles.flowRateInput} ${error ? styles.pipeFieldInputError : ""}`}
							value={flowRate}
							status={error ? "error" : undefined}
							inputMode="decimal"
							placeholder={
								requiredError
									? FLOW_RATE_REQUIRED_MSG
									: "请输入流量"
							}
							onChange={(e) =>
								handleFlowRateChange(record.id, e.target.value)
							}
						/>
						{sideError ? (
							<span className={styles.pipeFieldError}>
								{sideError}
							</span>
						) : null}
					</div>
				);
			},
		},
		{
			title: "操作",
			key: "actions",
			width: "10%",
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
				onBuildingChange={handleBuildingChange}
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
									onClick={() =>
										handleConfigTypeChange(item.key)
									}
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
							<span>
								新增{configType === "room" ? "房间" : "设备"}
								管道
							</span>
						</button>
					</div>
					<Table
						key={configType}
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

			<CreateModal
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
