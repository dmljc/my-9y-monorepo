import { App, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import {
	create,
	list,
	listBuildings,
	remove,
	toggleStatus,
	update,
} from "./api";
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

const AddDevice = () => {
	const { message, modal } = App.useApp();
	const pageRef = useRef<HTMLDivElement>(null);
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
		const tabs = normalizeBuildingTabs(buildingsData);
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
		void loadBuildings();
	}, []);

	const handleBuildingChange = (key: string) => {
		setBuildingKey(key);
		setPageNum(1);
		const tab = buildings.find((item) => item.key === key);
		if (tab) void loadDevices(tab.buildingId);
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

	const handleToggleStatus = (record: Device) => {
		const closing = record.status === "running";
		modal.confirm({
			title: closing ? "确认关闭" : "确认开启",
			content: closing
				? `确定将设备「${record.deviceCode}」关闭吗？关闭后可编辑或删除。`
				: `确定将设备「${record.deviceCode}」开启为进行中吗？`,
			okText: "确定",
			onOk: async () => {
				await toggleStatus(record.id);
				message.success(closing ? "已关闭" : "已开启");
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
				if (record.status === "running") {
					return (
						<div className={styles.actions}>
							<button
								type="button"
								className={styles.actionBtn}
								onClick={() => handleToggleStatus(record)}
							>
								关闭
							</button>
						</div>
					);
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
							onClick={() => handleToggleStatus(record)}
						>
							开启
						</button>
						<button
							type="button"
							className={styles.actionBtn}
							onClick={() => handleDelete(record)}
						>
							删除
						</button>
					</div>
				);
			},
		},
	];

	return (
		<div className={styles.addDevice} data-page="add-device">
			<div ref={pageRef} className={styles.stage}>
				<BuildingPageHeader
					buildingKey={buildingKey}
					buildings={buildings}
					onBuildingChange={handleBuildingChange}
				/>

				<div className={styles.body}>
					<div className={styles.panel}>
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
									<title>添加设备</title>
									<path
										d="M12 5v14M5 12h14"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
									/>
								</svg>
								<span>添加设备</span>
							</button>
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
					getContainer={() => pageRef.current ?? document.body}
					onCancel={() => setModalOpen(false)}
					onOk={handleModalSubmit}
				/>
			</div>
		</div>
	);
};

export default AddDevice;
