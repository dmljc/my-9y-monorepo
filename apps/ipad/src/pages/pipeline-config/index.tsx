import { App, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Access from "@/components/Access";
import { PERM_PIPELINE, PIPELINE_BUILDING_PERMS } from "@/constants/permission";
import { usePermission } from "@/hooks/usePermission";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import { filterBuildingsByPermission } from "@/utils";
import {
	addRoomPipeline,
	listBuildings,
	listRoomPipelines,
	removeRoomPipeline,
	saveRoomPipeline,
} from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type {
	BuildingTab,
	PipelineFormValues,
	PipelineItem,
} from "./interface";
import {
	DEFAULT_PAGE_SIZE,
	mapRoomRowToItem,
	normalizeBuildingTabs,
	PAGE_SIZE_OPTIONS,
	parseRoomPipelineList,
} from "./utils";

const PipelineConfig = () => {
	const { message, modal } = App.useApp();
	const pageRef = useRef<HTMLDivElement>(null);
	const canList = usePermission(PERM_PIPELINE.LIST);
	const [buildings, setBuildings] = useState<BuildingTab[]>([]);
	const [buildingKey, setBuildingKey] = useState("");
	const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<PipelineItem | null>(
		null,
	);

	const currentBuilding =
		buildings.find((item) => item.key === buildingKey) ?? null;
	const loadRoomList = async (buildingId: number) => {
		const listData = await listRoomPipelines(buildingId);
		const rows = parseRoomPipelineList(listData)
			.map((row) => mapRoomRowToItem(row, buildingId))
			.filter((item): item is PipelineItem => item !== null);
		setPipelines(rows);
		setPageNum((prev) => {
			const maxPage = Math.max(
				1,
				Math.ceil(rows.length / pageSize) || 1,
			);
			return Math.min(prev, maxPage);
		});
	};

	const loadList = async (building: BuildingTab) => {
		setLoading(true);
		try {
			await loadRoomList(building.buildingId);
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
			return;
		}
		const nextKey =
			tabs.some((item) => item.key === buildingKey) && buildingKey
				? buildingKey
				: tabs[0].key;
		setBuildingKey(nextKey);
		const tab = tabs.find((item) => item.key === nextKey);
		if (tab) await loadList(tab);
	};

	useEffect(() => {
		if (!canList) return;
		loadBuildings();
	}, [canList]);

	const handleBuildingChange = (key: string) => {
		setBuildingKey(key);
		setPageNum(1);
		const tab = buildings.find((item) => item.key === key);
		if (tab) loadList(tab);
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		setPageNum(pagination.current ?? 1);
		setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
	};

	const handleAdd = () => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房，无法新增配置");
			return;
		}
		setEditingRecord(null);
		setModalOpen(true);
	};

	const handleEdit = (record: PipelineItem) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleDelete = (record: PipelineItem) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除房间「${record.sampleRoom}」的管道配置吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				await removeRoomPipeline(String(record.configId ?? record.id));
				message.success("删除成功");
				if (currentBuilding) await loadList(currentBuilding);
			},
		});
	};

	const handleModalSubmit = async (values: PipelineFormValues) => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房，无法新增配置");
			throw new Error("no building");
		}

		const roomId = Number(values.roomId);
		const pipeIn = String(values.pipeIn ?? "").trim();
		const room = values.room?.trim();
		if (!Number.isInteger(roomId) || roomId <= 0 || !room) {
			message.warning("请选择有效的房间号");
			throw new Error("invalid room");
		}

		const payload = {
			id: editingRecord?.configId ?? editingRecord?.id,
			buildingId: currentBuilding.buildingId,
			roomId,
			room,
			pipelineId: pipeIn,
		};
		if (editingRecord) {
			await saveRoomPipeline(payload);
		} else {
			await addRoomPipeline({
				buildingId: payload.buildingId,
				roomId: payload.roomId,
				room: payload.room,
				pipelineId: payload.pipelineId,
			});
		}
		message.success(editingRecord ? "编辑成功" : "新增成功");
		await loadList(currentBuilding);
	};

	const columns: ColumnsType<PipelineItem> = [
		{
			title: "房间号",
			dataIndex: "sampleRoom",
			key: "sampleRoom",
			ellipsis: true,
			width: "28%",
		},
		{
			title: "管道号（IN）",
			dataIndex: "pipeIn",
			key: "pipeIn",
			ellipsis: true,
		},
		{
			title: "操作",
			key: "actions",
			align: "center",
			render: (_, record) => (
				<div className={styles.actions}>
					<Access code={PERM_PIPELINE.SAVE_ROOM}>
						<button
							type="button"
							className={styles.actionBtn}
							onClick={() => handleEdit(record)}
						>
							编辑
						</button>
					</Access>
					<Access code={PERM_PIPELINE.SAVE_ROOM}>
						<button
							type="button"
							className={styles.actionBtn}
							onClick={() => handleDelete(record)}
						>
							删除
						</button>
					</Access>
				</div>
			),
		},
	];

	if (!canList) {
		return <Navigate to="/home" replace />;
	}

	return (
		<div className={styles.pipelineConfig} data-page="pipeline-config">
			<div ref={pageRef} className={styles.stage}>
				<BuildingPageHeader
					buildingKey={buildingKey}
					buildings={buildings}
					onBuildingChange={handleBuildingChange}
				/>

				<div className={styles.body}>
					<div className={styles.panel}>
						<Access code={PERM_PIPELINE.SAVE_ROOM}>
							<div className={styles.toolbar}>
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
										<title>新增配置</title>
										<path
											d="M12 5v14M5 12h14"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.5"
											strokeLinecap="round"
										/>
									</svg>
									<span>新增配置</span>
								</button>
							</div>
						</Access>
						<Table
							className={styles.table}
							columns={columns}
							dataSource={pipelines}
							loading={loading}
							rowKey="id"
							pagination={{
								current: pageNum,
								pageSize,
								total: pipelines.length,
								showSizeChanger: true,
								pageSizeOptions: PAGE_SIZE_OPTIONS,
								showQuickJumper: true,
								showTotal: (count) => `共 ${count} 条`,
							}}
							onChange={handleTableChange}
							rowClassName={(_, index) =>
								index % 2 === 1 ? styles.rowStripe : ""
							}
						/>
					</div>
				</div>
				<CreateModal
					open={modalOpen}
					editingRecord={editingRecord}
					buildingId={currentBuilding?.buildingId ?? 0}
					getContainer={() => pageRef.current ?? document.body}
					onCancel={() => setModalOpen(false)}
					onOk={handleModalSubmit}
				/>
			</div>
		</div>
	);
};

export default PipelineConfig;
