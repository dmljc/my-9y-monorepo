import mockdata from "@/mock/mockdata.json";

/**
 * 厂房 Tab。
 */
export interface BuildingTab {
	key: string;
	label: string;
}

/**
 * 管道配置 Tab 类型（房间 / 设备）。
 */
export type PipelineConfigType = "room" | "device";

/**
 * 管道配置列表行状态。
 */
export type PipelineStatus = "running" | "closed";

/**
 * 管道配置列表行。
 */
export interface PipelineItem {
	id: string;
	deviceCode: string;
	deviceName: string;
	sampleRoom: string;
	status: PipelineStatus;
	buildingKey: string;
	configType: PipelineConfigType;
}

/**
 * 编辑管道配置表单值。
 */
export interface PipelineFormValues {
	deviceCode: string;
	deviceName: string;
	sampleRoom: string;
}

/**
 * 厂房 Tab 列表。
 */
export const BUILDING_TABS: BuildingTab[] = mockdata.buildings;

/**
 * 管道配置分段选项。
 */
export const CONFIG_TYPE_OPTIONS: {
	key: PipelineConfigType;
	label: string;
}[] = [
	{ key: "room", label: "房间管道配置" },
	{ key: "device", label: "设备管道配置" },
];

/**
 * 状态展示文案。
 */
export const STATUS_LABEL: Record<PipelineStatus, string> = {
	running: "进行中",
	closed: "已关闭",
};

/**
 * 按厂房与配置类型读取管道配置列表（浅拷贝，便于页面内编辑）。
 *
 * @param {string} - 厂房 key。
 * @param {PipelineConfigType} - 房间 / 设备配置类型。
 * @returns {PipelineItem[]} - 该厂房下对应类型的管道配置列表。
 */
export const getPipelinesByBuilding = (
	buildingKey: string,
	configType: PipelineConfigType,
): PipelineItem[] => {
	return mockdata.pipelineConfigs
		.filter(
			(item) =>
				item.buildingKey === buildingKey &&
				item.configType === configType,
		)
		.map((item) => ({
			...item,
			status: item.status as PipelineStatus,
			configType: item.configType as PipelineConfigType,
		}));
};
