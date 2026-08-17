import { App, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Access from "@/components/Access";
import { LEDGER_BUILDING_PERMS, PERM_LEDGER } from "@/constants/permission";
import { usePermission } from "@/hooks/usePermission";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import { filterBuildingsByPermission } from "@/utils";
import { create, list, listBuildings, remove, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type { BuildingTab, Device, DeviceFormValues } from "./interface";
import {
	buildCreatePayload,
	buildUpdatePayload,
	DEFAULT_PAGE_SIZE,
	mapRowToDevice,
	normalizeBuildingTabs,
	PAGE_SIZE_OPTIONS,
	parseDeviceList,
	STATUS_LABEL,
} from "./utils";

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

const AddDevice = () => {
	const { message, modal } = App.useApp();
	const canList = usePermission(PERM_LEDGER.LIST);
	const pageRef = useRef<HTMLDivElement>(null);
	const [keyboardOpen, setKeyboardOpen] = useState(false);
	const largestViewportHeightRef = useRef(0);
	const [buildings, setBuildings] = useState<BuildingTab[]>([]);
	const [buildingKey, setBuildingKey] = useState("");
	const [devices, setDevices] = useState<Device[]>([]);
	const [loading, setLoading] = useState(false);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<Device | null>(null);

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

	const loadDevices = async (buildingId: number) => {
		setLoading(true);
		try {
			const data = await list(buildingId);
			const rows = parseDeviceList(data).map(mapRowToDevice);
			setDevices(rows);
			setPageNum((prev) => {
				const maxPage = Math.max(
					1,
					Math.ceil(rows.length / pageSize) || 1,
				);
				return Math.min(prev, maxPage);
			});
		} finally {
			setLoading(false);
		}
	};

	const loadBuildings = async () => {
		const buildingsData = await listBuildings();
		const tabs = filterBuildingsByPermission(
			normalizeBuildingTabs(buildingsData),
			LEDGER_BUILDING_PERMS,
		);
		setBuildings(tabs);
		if (!tabs.length) {
			setBuildingKey("");
			setDevices([]);
			return;
		}
		const nextKey =
			tabs.some((item) => item.key === buildingKey) && buildingKey
				? buildingKey
				: tabs[0].key;
		setBuildingKey(nextKey);
		const tab = tabs.find((item) => item.key === nextKey);
		if (tab) await loadDevices(tab.buildingId);
	};

	useEffect(() => {
		if (!canList) return;
		loadBuildings();
	}, [canList]);

	const handleBuildingChange = (key: string) => {
		setBuildingKey(key);
		setPageNum(1);
		const tab = buildings.find((item) => item.key === key);
		if (tab) loadDevices(tab.buildingId);
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		setPageNum(pagination.current ?? 1);
		setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
	};

	const handleAdd = () => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房，无法添加设备");
			return;
		}
		setEditingRecord(null);
		setModalOpen(true);
	};

	const handleEdit = (record: Device) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleDelete = (record: Device) => {
		modal.confirm({
			title: "确认删除",
			content: `确定要删除设备「${record.deviceCode}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				await remove(String(record.id));
				if (editingRecord?.id === record.id) {
					setModalOpen(false);
					setEditingRecord(null);
				}
				message.success("删除成功");
				if (currentBuilding)
					await loadDevices(currentBuilding.buildingId);
			},
		});
	};

	const handleModalSubmit = async (values: DeviceFormValues) => {
		if (editingRecord) {
			await update(
				buildUpdatePayload(values, editingRecord, currentBuilding),
			);
			message.success("编辑成功");
			if (currentBuilding) await loadDevices(currentBuilding.buildingId);
			return;
		}

		if (!currentBuilding) {
			message.warning("暂无可用厂房，无法添加设备");
			return;
		}

		await create(buildCreatePayload(values, currentBuilding));
		message.success("新增成功");
		await loadDevices(currentBuilding.buildingId);
	};

	const columns: ColumnsType<Device> = [
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
			title: "取样房间",
			dataIndex: "sampleRoom",
			key: "sampleRoom",
			ellipsis: true,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			render: (status: Device["status"]) => (
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
			align: "center",
			render: (_, record) => {
				if (record.status === "running") return null;
				return (
					<div className={styles.actions}>
						<Access code={PERM_LEDGER.EDIT}>
							<button
								type="button"
								className={styles.actionBtn}
								onClick={() => handleEdit(record)}
							>
								编辑
							</button>
						</Access>
						<Access code={PERM_LEDGER.REMOVE}>
							<button
								type="button"
								className={styles.actionBtn}
								onClick={() => handleDelete(record)}
							>
								删除
							</button>
						</Access>
					</div>
				);
			},
		},
	];

	if (!canList) {
		return <Navigate to="/home" replace />;
	}

	return (
		<div
			ref={pageRef}
			className={styles.addDevice}
			data-page="add-device"
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
							<Access code={PERM_LEDGER.ADD}>
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
										<title>新增设备</title>
										<path
											d="M12 5v14M5 12h14"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.5"
											strokeLinecap="round"
										/>
									</svg>
									<span>新增设备</span>
								</button>
							</Access>
						</div>
						<Table
							className={styles.table}
							columns={columns}
							dataSource={devices}
							loading={loading}
							rowKey="id"
							pagination={{
								current: pageNum,
								pageSize,
								total: devices.length,
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
					keyboardOpen={keyboardOpen}
					getContainer={() => pageRef.current ?? document.body}
					onCancel={() => setModalOpen(false)}
					onOk={handleModalSubmit}
				/>
			</div>
		</div>
	);
};

export default AddDevice;
