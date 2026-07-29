import mockdata from "@/mock/mockdata.json";
import { sortBuildingTabs } from "@/utils/buildingTabs";

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
	/** 是否处于清洗中。 */
	cleaning: boolean;
	temperature: number;
	flowRate: number;
	buildingKey: string;
}

/**
 * 厂房 Tab 列表（来自 mockdata.json）。
 */
export const BUILDING_TABS: BuildingTab[] = sortBuildingTabs(
	mockdata.buildings,
);

/**
 * 根据字符串生成稳定哈希，用于 mock 名称长度。
 *
 * @param {string} - 种子字符串。
 * @returns {number} - 非负哈希值。
 */
const hashSeed = (seed: string): number => {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
};

/**
 * 生成 6～20 个汉字的 mock 设备名称（长度按种子稳定伪随机）。
 *
 * @param {string} - 设备 id，作为长度种子。
 * @returns {string} - 指定长度的设备名称。
 */
const buildMockDeviceName = (deviceId: string): string => {
	const length = 6 + (hashSeed(deviceId) % 15);
	return `设备${"名称".repeat(10)}`.slice(0, length);
};

/**
 * 按厂房 key 读取 mock 设备列表。
 *
 * @param {string} - 厂房 key。
 * @returns {DeviceItem[]} - 该厂房下的设备列表。
 */
export const getDevicesByBuilding = (buildingKey: string): DeviceItem[] => {
	return mockdata.devices
		.filter((item) => item.buildingKey === buildingKey)
		.map((item) => ({
			...item,
			name: buildMockDeviceName(item.id),
		}));
};
