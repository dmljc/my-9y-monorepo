import { App, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import styles from "./index.module.css";
import {
	BUILDING_TABS,
	getSampleDevicesByBuilding,
	ROOM_OPTIONS,
	type SampleDevice,
} from "./utils";

const SampleConfig = () => {
	const { message } = App.useApp();
	const [buildingKey, setBuildingKey] = useState(BUILDING_TABS[0].key);
	const [devices, setDevices] = useState<SampleDevice[]>(() =>
		getSampleDevicesByBuilding(BUILDING_TABS[0].key),
	);
	const [masterOn, setMasterOn] = useState(true);

	useEffect(() => {
		setDevices(getSampleDevicesByBuilding(buildingKey));
	}, [buildingKey]);

	const handleMasterChange = (checked: boolean) => {
		setMasterOn(checked);
		message.success(
			checked ? "“厂房名称”总开关已开启" : "“厂房名称”总开关已关闭",
		);
	};

	const handleRoomChange = (id: string, roomId: string) => {
		setDevices((prev) =>
			prev.map((item) => (item.id === id ? { ...item, roomId } : item)),
		);
	};

	const handleSave = (record: SampleDevice) => {
		if (!record.roomId) {
			message.warning("请选择房间号");
			return;
		}
		message.success("保存成功");
	};

	const columns: ColumnsType<SampleDevice> = [
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
			title: "房间号",
			dataIndex: "roomId",
			key: "roomId",
			render: (roomId: string, record) => (
				<Select
					className={styles.roomSelect}
					classNames={{ popup: { root: styles.roomDropdown } }}
					placeholder="请选择房间号"
					value={roomId || undefined}
					options={ROOM_OPTIONS}
					onChange={(value) => handleRoomChange(record.id, value)}
					allowClear
				/>
			),
		},
		{
			title: "操作",
			key: "actions",
			width: "9%",
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

	return (
		<div className={styles.sampleConfig} data-page="sample-config">
			<BuildingPageHeader
				buildingKey={buildingKey}
				buildings={BUILDING_TABS}
				onBuildingChange={setBuildingKey}
				masterOn={masterOn}
				onMasterChange={handleMasterChange}
			/>

			<div className={styles.body}>
				<div className={styles.panel}>
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
		</div>
	);
};

export default SampleConfig;
