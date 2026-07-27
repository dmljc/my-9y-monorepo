import mockdata from "@/mock/mockdata.json";

/**
 * 厂房 Tab。
 */
export interface BuildingTab {
	key: string;
	label: string;
}

/**
 * 设备列表行状态。
 */
export type Status = "running" | "closed";

/**
 * 设备列表行。
 */
export interface Device {
	id: string;
	deviceCode: string;
	deviceName: string;
	sampleRoom: string;
	manufacturer: string;
	status: Status;
	buildingKey: string;
}

/**
 * 新增 / 编辑设备表单值。
 */
export interface FormValues {
	deviceCode: string;
	deviceName: string;
	manufacturer: string;
}

/**
 * 设备编码 / 名称 / 厂家最大长度。
 */
export const MAX_LENGTH_40 = 40;

/**
 * 厂房 Tab 列表。
 */
export const BUILDING_TABS: BuildingTab[] = mockdata.buildings;

/**
 * 状态展示文案。
 */
export const STATUS_LABEL: Record<Status, string> = {
	running: "进行中",
	closed: "已关闭",
};

/**
 * 按厂房读取设备列表（浅拷贝，便于页面内编辑）。
 *
 * @param {string} - 厂房 key。
 * @returns {Device[]} - 该厂房下的设备列表。
 */
export const getDevicesByBuilding = (buildingKey: string): Device[] => {
	return mockdata.addDevices
		.filter((item) => item.buildingKey === buildingKey)
		.map((item) => ({
			...item,
			status: item.status as Status,
		}));
};
