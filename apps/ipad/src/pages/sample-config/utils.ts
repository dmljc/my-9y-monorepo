import mockdata from "@/mock/mockdata.json";

/**
 * 厂房 Tab。
 */
export interface BuildingTab {
	key: string;
	label: string;
}

/**
 * 房间下拉选项。
 */
export interface RoomOption {
	value: string;
	label: string;
}

/**
 * 取样配置列表行。
 */
export interface SampleDevice {
	id: string;
	deviceCode: string;
	deviceName: string;
	/** 已选房间 id，空串表示未选。 */
	roomId: string;
	buildingKey: string;
}

/**
 * 厂房 Tab 列表。
 */
export const BUILDING_TABS: BuildingTab[] = mockdata.buildings;

/**
 * 房间号下拉选项。
 */
export const ROOM_OPTIONS: RoomOption[] = mockdata.sampleRooms;

/**
 * 按厂房读取取样设备列表（浅拷贝，便于页面内编辑）。
 *
 * @param {string} - 厂房 key。
 * @returns {SampleDevice[]} - 该厂房下的取样设备。
 */
export const getSampleDevicesByBuilding = (
	buildingKey: string,
): SampleDevice[] => {
	return mockdata.sampleDevices
		.filter((item) => item.buildingKey === buildingKey)
		.map((item) => ({ ...item }));
};
