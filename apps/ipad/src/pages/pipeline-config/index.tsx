import { App, Input, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Access from "@/components/Access";
import { PERM_PIPELINE, PIPELINE_BUILDING_PERMS } from "@/constants/permission";
import { usePermission } from "@/hooks/usePermission";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import { filterBuildingsByPermission } from "@/utils";
import {
	listBuildings,
	listDevicePipelines,
	listPipelineOptions,
	listRoomPipelines,
	saveDevicePipeline,
	saveRoomPipeline,
} from "./api";
import styles from "./index.module.css";
import type {
	BuildingTab,
	DevicePipelineRow,
	PipelineConfigType,
	PipelineItem,
	PipeOption,
} from "./interface";
import {
	buildPipeOptionsFromData,
	CONFIG_TYPE_OPTIONS,
	FLOW_RATE_REQUIRED_MSG,
	getRoomByPipeNo,
	mapDeviceRowToItem,
	mapRoomRowToItem,
	normalizeBuildingTabs,
	PIPE_NO_REQUIRED_MSG,
	parseArrayData,
	parseRoomPipelineList,
	sanitizeFlowRateInput,
	validateDevicePipeOut,
	validateFlowRate,
	validateRoomPipeIn,
} from "./utils";

const PipelineConfig = () => {
	const { message } = App.useApp();
	const canList = usePermission(PERM_PIPELINE.LIST);
	const [buildings, setBuildings] = useState<BuildingTab[]>([]);
	const [buildingKey, setBuildingKey] = useState("");
	const [configType, setConfigType] = useState<PipelineConfigType>("device");
	const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [pipeOptions, setPipeOptions] = useState<PipeOption[]>([]);
	const [roomByPipe, setRoomByPipe] = useState<Record<string, string>>({});
	/** 行级管道号错误文案（房间 IN / 设备 OUT）。 */
	const [pipeNoErrors, setPipeNoErrors] = useState<Record<number, string>>(
		{},
	);
	/** 设备配置：行级流量错误文案。 */
	const [flowRateErrors, setFlowRateErrors] = useState<
		Record<number, string>
	>({});

	const currentBuilding =
		buildings.find((item) => item.key === buildingKey) ?? null;
	const existingPipes = new Set(pipeOptions.map((item) => item.value));

	const clearFieldError = (
		setter: Dispatch<SetStateAction<Record<number, string>>>,
		id: number,
	) => {
		setter((prev) => {
			if (!prev[id]) return prev;
			const next = { ...prev };
			delete next[id];
			return next;
		});
	};

	const clearRowErrors = () => {
		setPipeNoErrors({});
		setFlowRateErrors({});
	};

	const loadPipeOptions = async (buildingId: number) => {
		const data = await listPipelineOptions(buildingId);
		const { options, roomByPipe: nextMap } = buildPipeOptionsFromData(data);
		setPipeOptions(options);
		setRoomByPipe(nextMap);
	};

	const loadRoomList = async (buildingId: number) => {
		const listData = await listRoomPipelines(buildingId);
		const rows = parseRoomPipelineList(listData)
			.map((row) => mapRoomRowToItem(row, buildingId))
			.filter((item): item is PipelineItem => item !== null);
		setPipelines(rows);
	};

	const loadDeviceList = async (buildingId: number) => {
		const data = await listDevicePipelines(buildingId);
		const rows = parseArrayData<DevicePipelineRow>(data)
			.map((row) => mapDeviceRowToItem(row, buildingId))
			.filter((item): item is PipelineItem => item !== null);
		setPipelines(rows);
	};

	const loadList = async (
		buildingId: number,
		nextConfigType: PipelineConfigType,
	) => {
		setLoading(true);
		clearRowErrors();
		try {
			await loadPipeOptions(buildingId);
			if (nextConfigType === "room") {
				await loadRoomList(buildingId);
			} else {
				await loadDeviceList(buildingId);
			}
		} finally {
			setLoading(false);
		}
	};

	const loadBuildings = async () => {
		const buildingsData = await listBuildings();
		const tabs = filterBuildingsByPermission(
			normalizeBuildingTabs(buildingsData),
			PIPELINE_BUILDING_PERMS,
		);
		setBuildings(tabs);
		if (!tabs.length) {
			setBuildingKey("");
			setPipelines([]);
			setPipeOptions([]);
			setRoomByPipe({});
			return;
		}
		const nextKey =
			tabs.some((item) => item.key === buildingKey) && buildingKey
				? buildingKey
				: tabs[0].key;
		setBuildingKey(nextKey);
		const tab = tabs.find((item) => item.key === nextKey);
		if (tab) await loadList(tab.buildingId, configType);
	};

	useEffect(() => {
		if (!canList) return;
		loadBuildings();
	}, [canList]);

	const handleBuildingChange = (key: string) => {
		setBuildingKey(key);
		const tab = buildings.find((item) => item.key === key);
		if (tab) loadList(tab.buildingId, configType);
	};

	const handleConfigTypeChange = (key: PipelineConfigType) => {
		setConfigType(key);
		if (currentBuilding) loadList(currentBuilding.buildingId, key);
	};

	const handlePipeInChange = (id: number, pipeIn: string) => {
		setPipelines((prev) =>
			prev.map((item) => (item.id === id ? { ...item, pipeIn } : item)),
		);
		clearFieldError(setPipeNoErrors, id);
	};

	const handlePipeOutChange = (id: number, pipeOut: string) => {
		const sampleRoom = getRoomByPipeNo(pipeOut, roomByPipe);
		setPipelines((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, pipeOut, sampleRoom } : item,
			),
		);
		clearFieldError(setPipeNoErrors, id);
	};

	const handleFlowRateChange = (id: number, raw: string) => {
		const flowRate = sanitizeFlowRateInput(raw);
		setPipelines((prev) =>
			prev.map((item) => (item.id === id ? { ...item, flowRate } : item)),
		);
		clearFieldError(setFlowRateErrors, id);
	};

	const handleSave = async (record: PipelineItem) => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房");
			return;
		}

		if (configType === "room") {
			const pipeIn = record.pipeIn.trim();
			if (pipeIn) {
				const error = validateRoomPipeIn(
					pipeIn,
					record.id,
					pipelines,
					existingPipes,
				);
				if (error) {
					setPipeNoErrors((prev) => ({
						...prev,
						[record.id]: error,
					}));
					return;
				}
			}
			if (!record.roomId) {
				message.error("缺少房间信息，无法保存");
				return;
			}
			clearFieldError(setPipeNoErrors, record.id);
			await saveRoomPipeline({
				id: record.configId ?? record.id,
				buildingId: currentBuilding.buildingId,
				roomId: record.roomId,
				room: record.sampleRoom,
				pipelineId: pipeIn,
			});
			message.success("保存成功");
			await loadRoomList(currentBuilding.buildingId);
			return;
		}

		const pipeError = validateDevicePipeOut(
			record.pipeOut,
			record.id,
			pipelines,
			existingPipes,
		);
		const pipeOut = record.pipeOut.trim();
		const flowRate = record.flowRate.trim();
		// 流量字段允许为空：只有在用户填写了流量时才校验其格式/范围。
		const flowError = flowRate ? validateFlowRate(flowRate) : "";
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
		await saveDevicePipeline({
			deviceId: record.deviceId ?? record.id,
			pipelineId: pipeOut,
			flowRate: flowRate ? Number(flowRate) : null,
		});
		message.success("保存成功");
		await loadDeviceList(currentBuilding.buildingId);
	};

	const renderRoomPipeSelect = (value: string, record: PipelineItem) => {
		const error = pipeNoErrors[record.id];
		return (
			<div className={styles.pipeFieldCell}>
				<Select
					className={`${styles.pipeFieldSelect} ${error ? styles.pipeFieldSelectError : ""}`}
					value={value || undefined}
					status={error ? "error" : undefined}
					placeholder="请选择"
					options={pipeOptions}
					showSearch={{ optionFilterProp: "label" }}
					allowClear
					onChange={(next) =>
						handlePipeInChange(record.id, next ?? "")
					}
				/>
				{error ? (
					<span className={styles.pipeFieldError}>{error}</span>
				) : null}
			</div>
		);
	};

	const renderPipeSelect = (
		value: string,
		record: PipelineItem,
		onChange: (id: number, next: string) => void,
		extraClassName?: string,
	) => {
		const error = pipeNoErrors[record.id];
		const requiredError = error === PIPE_NO_REQUIRED_MSG;
		const sideError = error && !requiredError ? error : "";
		return (
			<div
				className={`${styles.pipeFieldCell} ${extraClassName ?? ""}`.trim()}
			>
				<Select
					className={`${styles.pipeFieldSelect} ${error ? styles.pipeFieldSelectError : ""}`}
					value={value || undefined}
					status={error ? "error" : undefined}
					placeholder={
						requiredError ? PIPE_NO_REQUIRED_MSG : "请选择管道号"
					}
					options={pipeOptions}
					showSearch={{ optionFilterProp: "label" }}
					allowClear
					onChange={(next) => onChange(record.id, next ?? "")}
				/>
				{sideError ? (
					<span className={styles.pipeFieldError}>{sideError}</span>
				) : null}
			</div>
		);
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
			render: (pipeIn: string, record) =>
				renderRoomPipeSelect(pipeIn, record),
		},
		{
			title: "操作",
			key: "actions",
			width: "10%",
			render: (_, record) => (
				<Access code={PERM_PIPELINE.SAVE_ROOM}>
					<button
						type="button"
						className={styles.saveBtn}
						onClick={() => handleSave(record)}
					>
						保存
					</button>
				</Access>
			),
		},
	];

	const deviceColumns: ColumnsType<PipelineItem> = [
		{
			title: "设备编码",
			dataIndex: "deviceCode",
			key: "deviceCode",
			ellipsis: true,
			width: "28%",
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
			width: "22%",
			render: (pipeOut: string, record) =>
				renderPipeSelect(
					pipeOut,
					record,
					handlePipeOutChange,
					styles.pipeOutCell,
				),
		},
		{
			title: "房间号",
			dataIndex: "sampleRoom",
			key: "sampleRoom",
			ellipsis: true,
			width: "8%",
			render: (sampleRoom: string) => sampleRoom || "—",
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
				<Access code={PERM_PIPELINE.SAVE_DEVICE}>
					<button
						type="button"
						className={styles.saveBtn}
						onClick={() => handleSave(record)}
					>
						保存
					</button>
				</Access>
			),
		},
	];

	const columns = configType === "room" ? roomColumns : deviceColumns;

	if (!canList) {
		return <Navigate to="/home" replace />;
	}

	return (
		<div className={styles.pipelineConfig} data-page="pipeline-config">
			<div className={styles.stage}>
				<BuildingPageHeader
					buildingKey={buildingKey}
					buildings={buildings}
					onBuildingChange={handleBuildingChange}
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
						</div>
						<Table
							key={configType}
							className={styles.table}
							columns={columns}
							dataSource={pipelines}
							rowKey="id"
							loading={loading}
							pagination={false}
							rowClassName={(_, index) =>
								index % 2 === 1 ? styles.rowStripe : ""
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PipelineConfig;
