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
	addRoom,
	addRoomPipeline,
	listBuildings,
	listRoomPipelines,
	listRooms,
	removeRoom,
	removeRoomPipeline,
	saveRoom,
	saveRoomPipeline,
} from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type {
	BuildingTab,
	ConfigTab,
	PipelineFormValues,
	PipelineItem,
	RoomFormValues,
	RoomItem,
} from "./interface";
import RoomModal from "./RoomModal";
import {
	DEFAULT_PAGE_SIZE,
	formatPipeInLabel,
	mapRoomRowToItem,
	mapRoomToItem,
	normalizeBuildingTabs,
	normalizePipeInValue,
	PAGE_SIZE_OPTIONS,
	parseRoomList,
	parseRoomPipelineList,
} from "./utils";

const CONFIG_TABS: { key: ConfigTab; label: string }[] = [
	{ key: "pipeline", label: "管道配置" },
	{ key: "room", label: "房间配置" },
];

/**
 * 当前焦点是否位于会唤起软键盘的文本输入控件。
 */
const isTextInputFocused = (target: EventTarget | null) => {
	if (!(target instanceof Element)) {
		return false;
	}
	if (target instanceof HTMLTextAreaElement) {
		return true;
	}
	if (target instanceof HTMLInputElement) {
		return (
			target.type !== "checkbox" &&
			target.type !== "radio" &&
			target.type !== "button" &&
			target.type !== "submit"
		);
	}
	return Boolean(
		target.closest(".ant-input-affix-wrapper") ||
			target.closest(".ant-select-open"),
	);
};

const PipelineConfig = () => {
	const { message, modal } = App.useApp();
	const pageRef = useRef<HTMLDivElement>(null);
	const [keyboardOpen, setKeyboardOpen] = useState(false);
	const largestViewportHeightRef = useRef(0);
	const canList = usePermission(PERM_PIPELINE.LIST);
	const [buildings, setBuildings] = useState<BuildingTab[]>([]);
	const [buildingKey, setBuildingKey] = useState("");
	const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
	const [rooms, setRooms] = useState<RoomItem[]>([]);
	const [roomTotal, setRoomTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [activeTab, setActiveTab] = useState<ConfigTab>("pipeline");
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<PipelineItem | null>(
		null,
	);
	const [roomModalOpen, setRoomModalOpen] = useState(false);
	const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);

	const currentBuilding =
		buildings.find((item) => item.key === buildingKey) ?? null;

	/**
	 * HarmonyOS 软键盘适配：页面根节点贴齐 visualViewport，
	 * 避免 contain 舞台随剩余高度整体缩小。
	 */
	useEffect(() => {
		const root = pageRef.current;
		const viewport = window.visualViewport;
		if (!root) {
			return;
		}

		let blurTimer = 0;
		const syncViewportBox = () => {
			if (!viewport) {
				root.style.width = "";
				root.style.height = "";
				root.style.left = "";
				root.style.top = "";
				root.style.right = "";
				root.style.bottom = "";
				return;
			}
			root.style.width = `${viewport.width}px`;
			root.style.height = `${viewport.height}px`;
			root.style.left = `${viewport.offsetLeft}px`;
			root.style.top = `${viewport.offsetTop}px`;
			root.style.right = "auto";
			root.style.bottom = "auto";
		};

		const updateKeyboardState = () => {
			const visibleHeight = viewport?.height ?? window.innerHeight;
			largestViewportHeightRef.current = Math.max(
				largestViewportHeightRef.current,
				visibleHeight,
			);
			const focused = isTextInputFocused(document.activeElement);
			const shrunk =
				largestViewportHeightRef.current - visibleHeight > 120;
			window.clearTimeout(blurTimer);
			if (focused && shrunk) {
				setKeyboardOpen(true);
			} else if (!focused) {
				blurTimer = window.setTimeout(() => {
					if (!isTextInputFocused(document.activeElement)) {
						setKeyboardOpen(false);
					}
				}, 180);
			} else {
				setKeyboardOpen(false);
			}
			syncViewportBox();
		};

		largestViewportHeightRef.current =
			viewport?.height ?? window.innerHeight;
		syncViewportBox();
		updateKeyboardState();

		viewport?.addEventListener("resize", updateKeyboardState);
		viewport?.addEventListener("scroll", updateKeyboardState);
		window.addEventListener("resize", updateKeyboardState);
		document.addEventListener("focusin", updateKeyboardState);
		document.addEventListener("focusout", updateKeyboardState);
		return () => {
			window.clearTimeout(blurTimer);
			viewport?.removeEventListener("resize", updateKeyboardState);
			viewport?.removeEventListener("scroll", updateKeyboardState);
			window.removeEventListener("resize", updateKeyboardState);
			document.removeEventListener("focusin", updateKeyboardState);
			document.removeEventListener("focusout", updateKeyboardState);
			root.style.width = "";
			root.style.height = "";
			root.style.left = "";
			root.style.top = "";
			root.style.right = "";
			root.style.bottom = "";
		};
	}, []);

	const loadPipelines = async (buildingId: number) => {
		const listData = await listRoomPipelines(buildingId);
		const rows = parseRoomPipelineList(listData)
			.map((row) => mapRoomRowToItem(row, buildingId))
			.filter((item): item is PipelineItem => item !== null);
		setPipelines(rows);
		setPageNum((prev) => {
			const maxPage = Math.max(1, Math.ceil(rows.length / pageSize) || 1);
			return Math.min(prev, maxPage);
		});
	};

	const loadRooms = async (buildingId: number, p: number, ps: number) => {
		const data = await listRooms({
			buildingId,
			pageNum: p,
			pageSize: ps,
		});
		const rows = parseRoomList(data)
			.map((row) => mapRoomToItem(row, buildingId))
			.filter((item): item is RoomItem => item !== null);
		setRooms(rows);
		setRoomTotal(data?.total ?? rows.length);
		setPageNum(data?.pageNum ?? p);
		setPageSize(data?.pageSize ?? ps);
	};

	const loadList = async (
		building: BuildingTab,
		tab: ConfigTab = activeTab,
		p: number = pageNum,
		ps: number = pageSize,
	) => {
		setLoading(true);
		try {
			if (tab === "room") {
				await loadRooms(building.buildingId, p, ps);
			} else {
				await loadPipelines(building.buildingId);
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
			setRooms([]);
			setRoomTotal(0);
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
		if (tab) loadList(tab, activeTab, 1, pageSize);
	};

	const handleTabChange = (tab: ConfigTab) => {
		if (tab === activeTab) return;
		setActiveTab(tab);
		setPageNum(1);
		setModalOpen(false);
		setRoomModalOpen(false);
		setEditingRecord(null);
		setEditingRoom(null);
		if (currentBuilding) loadList(currentBuilding, tab, 1, pageSize);
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		const nextPage = pagination.current ?? 1;
		const nextSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
		setPageNum(nextPage);
		setPageSize(nextSize);
		if (activeTab === "room" && currentBuilding) {
			loadList(currentBuilding, "room", nextPage, nextSize);
		}
	};

	const handleAdd = () => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房，无法新增配置");
			return;
		}
		if (activeTab === "room") {
			setEditingRoom(null);
			setRoomModalOpen(true);
			return;
		}
		setEditingRecord(null);
		setModalOpen(true);
	};

	const handleEdit = (record: PipelineItem) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleEditRoom = (record: RoomItem) => {
		setEditingRoom(record);
		setRoomModalOpen(true);
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
				if (currentBuilding)
					await loadList(currentBuilding, "pipeline");
			},
		});
	};

	const handleDeleteRoom = (record: RoomItem) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除房间「${record.room}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				await removeRoom(String(record.id));
				message.success("删除成功");
				if (currentBuilding) {
					const nextPage =
						rooms.length <= 1 && pageNum > 1
							? pageNum - 1
							: pageNum;
					await loadList(currentBuilding, "room", nextPage, pageSize);
				}
			},
		});
	};

	const handleModalSubmit = async (values: PipelineFormValues) => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房，无法新增配置");
			throw new Error("no building");
		}

		const roomId = Number(values.roomId);
		const pipeIn = normalizePipeInValue(values.pipeIn);
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
		await loadList(currentBuilding, "pipeline");
	};

	const handleRoomModalSubmit = async (values: RoomFormValues) => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房，无法新增配置");
			throw new Error("no building");
		}

		const room = values.room.trim();
		if (editingRoom) {
			await saveRoom({
				id: editingRoom.id,
				buildingId: currentBuilding.buildingId,
				room,
			});
		} else {
			await addRoom({
				buildingId: currentBuilding.buildingId,
				room,
			});
		}
		message.success(editingRoom ? "编辑成功" : "新增成功");
		await loadList(
			currentBuilding,
			"room",
			editingRoom ? pageNum : 1,
			pageSize,
		);
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
			render: (pipeIn: string) => formatPipeInLabel(pipeIn),
		},
		{
			title: "操作",
			key: "actions",
			align: "center",
			render: (_, record) => (
				<div className={styles.actions}>
					<Access code={PERM_PIPELINE.EDIT}>
						<button
							type="button"
							className={styles.actionBtn}
							onClick={() => handleEdit(record)}
						>
							编辑
						</button>
					</Access>
					<Access code={PERM_PIPELINE.REMOVE}>
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

	const roomColumns: ColumnsType<RoomItem> = [
		{
			title: "房间号",
			dataIndex: "room",
			key: "room",
			ellipsis: true,
		},
		{
			title: "操作",
			key: "actions",
			align: "center",
			render: (_, record) => (
				<div className={styles.actions}>
					<Access code={PERM_PIPELINE.EDIT}>
						<button
							type="button"
							className={styles.actionBtn}
							onClick={() => handleEditRoom(record)}
						>
							编辑
						</button>
					</Access>
					<Access code={PERM_PIPELINE.REMOVE}>
						<button
							type="button"
							className={styles.actionBtn}
							onClick={() => handleDeleteRoom(record)}
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
		<div
			ref={pageRef}
			className={styles.pipelineConfig}
			data-page="pipeline-config"
			data-keyboard-open={keyboardOpen || undefined}
		>
			<div className={styles.stage}>
				<BuildingPageHeader
					buildingKey={buildingKey}
					buildings={buildings}
					onBuildingChange={handleBuildingChange}
				/>

				<div className={styles.body}>
					<div className={styles.panel}>
						<div className={styles.toolbar}>
							<div
								className={styles.tabSwitch}
								role="tablist"
								aria-label="配置类型"
							>
								{CONFIG_TABS.map((tab) => (
									<button
										key={tab.key}
										type="button"
										role="tab"
										aria-selected={activeTab === tab.key}
										className={`${styles.tabItem} ${
											activeTab === tab.key
												? styles.tabItemActive
												: ""
										}`}
										onClick={() => handleTabChange(tab.key)}
									>
										{tab.label}
									</button>
								))}
							</div>
							<Access
								code={[
									PERM_PIPELINE.ADD,
									PERM_PIPELINE.SAVE_ROOM,
								]}
							>
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
										<title>
											{activeTab === "room"
												? "新增房间配置"
												: "新增管道配置"}
										</title>
										<path
											d="M12 5v14M5 12h14"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.5"
											strokeLinecap="round"
										/>
									</svg>
									<span>
										{activeTab === "room"
											? "新增房间配置"
											: "新增管道配置"}
									</span>
								</button>
							</Access>
						</div>
						{activeTab === "room" ? (
							<Table
								className={styles.table}
								columns={roomColumns}
								dataSource={rooms}
								loading={loading}
								rowKey="id"
								pagination={{
									current: pageNum,
									pageSize,
									total: roomTotal,
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
						) : (
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
						)}
					</div>
				</div>
				<CreateModal
					open={modalOpen}
					editingRecord={editingRecord}
					keyboardOpen={keyboardOpen}
					buildingId={currentBuilding?.buildingId ?? 0}
					getContainer={() => pageRef.current ?? document.body}
					onCancel={() => setModalOpen(false)}
					onOk={handleModalSubmit}
				/>
				<RoomModal
					open={roomModalOpen}
					editingRecord={editingRoom}
					keyboardOpen={keyboardOpen}
					getContainer={() => pageRef.current ?? document.body}
					onCancel={() => setRoomModalOpen(false)}
					onOk={handleRoomModalSubmit}
				/>
			</div>
		</div>
	);
};

export default PipelineConfig;
