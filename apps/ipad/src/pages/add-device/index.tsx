import { App, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import AddDeviceModal from "./AddDeviceModal";
import styles from "./index.module.css";
import {
	type AddDevice,
	type AddDeviceFormValues,
	BUILDING_TABS,
	getAddDevicesByBuilding,
	STATUS_LABEL,
} from "./utils";

const AddDevicePage = () => {
	const { message } = App.useApp();
	const pageRef = useRef<HTMLDivElement>(null);
	const [buildingKey, setBuildingKey] = useState(BUILDING_TABS[0].key);
	const [devices, setDevices] = useState<AddDevice[]>(() =>
		getAddDevicesByBuilding(BUILDING_TABS[0].key),
	);
	const [masterOn, setMasterOn] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<AddDevice | null>(null);

	useEffect(() => {
		setDevices(getAddDevicesByBuilding(buildingKey));
	}, [buildingKey]);

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

	const handleEdit = (record: AddDevice) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleSave = (record: AddDevice) => {
		message.success(`“${record.deviceName}”已保存`);
	};

	const handleModalSubmit = async (values: AddDeviceFormValues) => {
		if (editingRecord) {
			setDevices((prev) =>
				prev.map((item) =>
					item.id === editingRecord.id
						? {
								...item,
								deviceCode: values.deviceCode,
								deviceName: values.deviceName,
								manufacturer: values.manufacturer,
							}
						: item,
				),
			);
			message.success("编辑成功");
			return;
		}

		const newItem: AddDevice = {
			id: `${buildingKey}-add-${Date.now()}`,
			deviceCode: values.deviceCode,
			deviceName: values.deviceName,
			manufacturer: values.manufacturer,
			sampleRoom: "—",
			status: "closed",
			buildingKey,
		};
		setDevices((prev) => [newItem, ...prev]);
		message.success("新增成功");
	};

	const columns: ColumnsType<AddDevice> = [
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
			render: (status: AddDevice["status"]) => (
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
		<div ref={pageRef} className={styles.addDevice} data-page="add-device">
			<BuildingPageHeader
				buildingKey={buildingKey}
				buildings={BUILDING_TABS}
				onBuildingChange={setBuildingKey}
				masterOn={masterOn}
				onMasterChange={handleMasterChange}
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
								<title>添加</title>
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
						rowKey="id"
						pagination={false}
						rowClassName={(_, index) =>
							index % 2 === 1 ? styles.rowStripe : ""
						}
					/>
				</div>
			</div>

			<AddDeviceModal
				open={modalOpen}
				editingRecord={editingRecord}
				getContainer={() => pageRef.current ?? document.body}
				onCancel={() => setModalOpen(false)}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default AddDevicePage;
