import { App, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Access from "@/components/Access";
import { PERM_PIPELINE, PIPELINE_BUILDING_PERMS } from "@/constants/permission";
import { usePermission } from "@/hooks/usePermission";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import { filterBuildingsByPermission } from "@/utils";
import {
	listBuildings,
	listPipelineOptions,
	listRoomPipelines,
	saveRoomPipeline,
} from "./api";
import styles from "./index.module.css";
import type { BuildingTab, PipelineItem, PipeOption } from "./interface";
import {
	buildPipeOptionsFromData,
	mapRoomRowToItem,
	normalizeBuildingTabs,
	parseRoomPipelineList,
	validateRoomPipeIn,
} from "./utils";

const PipelineConfig = () => {
	const { message } = App.useApp();
	const canList = usePermission(PERM_PIPELINE.LIST);
	const [buildings, setBuildings] = useState<BuildingTab[]>([]);
	const [buildingKey, setBuildingKey] = useState("");
	const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [pipeOptions, setPipeOptions] = useState<PipeOption[]>([]);
	const [pipeNoErrors, setPipeNoErrors] = useState<Record<number, string>>(
		{},
	);

	const currentBuilding =
		buildings.find((item) => item.key === buildingKey) ?? null;
	const existingPipes = new Set(pipeOptions.map((item) => item.value));

	const clearFieldError = (id: number) => {
		setPipeNoErrors((prev) => {
			if (!prev[id]) return prev;
			const next = { ...prev };
			delete next[id];
			return next;
		});
	};

	const loadPipeOptions = async (buildingId: number) => {
		const data = await listPipelineOptions(buildingId);
		setPipeOptions(buildPipeOptionsFromData(data));
	};

	const loadRoomList = async (buildingId: number) => {
		const listData = await listRoomPipelines(buildingId);
		const rows = parseRoomPipelineList(listData)
			.map((row) => mapRoomRowToItem(row, buildingId))
			.filter((item): item is PipelineItem => item !== null);
		setPipelines(rows);
	};

	const loadList = async (buildingId: number) => {
		setLoading(true);
		setPipeNoErrors({});
		try {
			await loadPipeOptions(buildingId);
			await loadRoomList(buildingId);
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
			return;
		}
		const nextKey =
			tabs.some((item) => item.key === buildingKey) && buildingKey
				? buildingKey
				: tabs[0].key;
		setBuildingKey(nextKey);
		const tab = tabs.find((item) => item.key === nextKey);
		if (tab) await loadList(tab.buildingId);
	};

	useEffect(() => {
		if (!canList) return;
		loadBuildings();
	}, [canList]);

	const handleBuildingChange = (key: string) => {
		setBuildingKey(key);
		const tab = buildings.find((item) => item.key === key);
		if (tab) loadList(tab.buildingId);
	};

	const handlePipeInChange = (id: number, pipeIn: string) => {
		setPipelines((prev) =>
			prev.map((item) => (item.id === id ? { ...item, pipeIn } : item)),
		);
		clearFieldError(id);
	};

	const handleSave = async (record: PipelineItem) => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房");
			return;
		}

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
		clearFieldError(record.id);
		await saveRoomPipeline({
			id: record.configId ?? record.id,
			buildingId: currentBuilding.buildingId,
			roomId: record.roomId,
			room: record.sampleRoom,
			pipelineId: pipeIn,
		});
		message.success("保存成功");
		await loadRoomList(currentBuilding.buildingId);
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

	const columns: ColumnsType<PipelineItem> = [
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
						<Table
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
