import mockdata from "@/mock/mockdata.json";

/**
 * 厂房 Tab（脱敏编码）。
 */
export interface BuildingTab {
	key: string;
	label: string;
}

/**
 * 设备列表项。
 */
export interface DeviceItem {
	id: string;
	code: string;
	name: string;
	levelLabel: string;
	roomLabel: string;
	enabled: boolean;
	temperature: number;
	flowRate: number;
	buildingKey: string;
}

/**
 * 厂房 Tab 列表（来自 mockdata.json）。
 */
export const BUILDING_TABS: BuildingTab[] = mockdata.buildings;

/**
 * 按厂房 key 读取 mock 设备列表。
 *
 * @param {string} - 厂房 key。
 * @returns {DeviceItem[]} - 该厂房下的设备列表。
 */
export const getDevicesByBuilding = (buildingKey: string): DeviceItem[] => {
	return mockdata.devices.filter((item) => item.buildingKey === buildingKey);
};
