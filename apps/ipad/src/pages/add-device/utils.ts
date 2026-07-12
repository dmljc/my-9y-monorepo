import mockdata from "@/mock/mockdata.json";

/**
 * 厂房 Tab。
 */
export interface BuildingTab {
	key: string;
	label: string;
}

/**
 * 添加设备列表行状态。
 */
export type AddDeviceStatus = "running" | "closed";

/**
 * 添加设备列表行。
 */
export interface AddDevice {
	id: string;
	deviceCode: string;
	deviceName: string;
	sampleRoom: string;
	manufacturer: string;
	status: AddDeviceStatus;
	buildingKey: string;
}

/**
 * 添加 / 编辑设备表单值。
 */
export interface AddDeviceFormValues {
	deviceCode: string;
	deviceName: string;
	manufacturer: string;
}

/**
 * 厂房 Tab 列表。
 */
export const BUILDING_TABS: BuildingTab[] = mockdata.buildings;

/**
 * 状态展示文案。
 */
export const STATUS_LABEL: Record<AddDeviceStatus, string> = {
	running: "进行中",
	closed: "已关闭",
};

/**
 * 按厂房读取添加设备列表（浅拷贝，便于页面内编辑）。
 *
 * @param {string} - 厂房 key。
 * @returns {AddDevice[]} - 该厂房下的设备列表。
 */
export const getAddDevicesByBuilding = (buildingKey: string): AddDevice[] => {
	return mockdata.addDevices
		.filter((item) => item.buildingKey === buildingKey)
		.map((item) => ({
			...item,
			status: item.status as AddDeviceStatus,
		}));
};
