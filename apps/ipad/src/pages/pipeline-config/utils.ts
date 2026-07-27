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
	/** 房间号（房间配置）/ 取样房间号（设备配置）。 */
	sampleRoom: string;
	/** 管道号（IN）。 */
	pipeIn: string;
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
	pipeIn: string;
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
 * 系统中已存在的管道号（mock 白名单，仅数字）。
 */
export const EXISTING_PIPE_IN_SET = new Set([
	"1001",
	"1002",
	"1003",
	"1004",
	"1005",
	"1006",
	"1007",
	"1008",
	"1009",
	"1010",
	"1011",
	"1012",
	"1013",
	"1014",
	"2001",
	"2002",
	"2003",
]);

/** 管道号不存在提示。 */
export const PIPE_IN_NOT_FOUND_MSG = "管道号不存在，请重新输入";

/** 管道号重复提示。 */
export const PIPE_IN_DUPLICATE_MSG = "管道号已存在，请重新输入";

/**
 * 仅保留数字字符。
 *
 * @param {string} - 原始输入。
 * @returns {string} - 过滤后的数字串。
 */
export const sanitizePipeInInput = (value: string): string => {
	return value.replace(/\D/g, "");
};

/**
 * 校验房间管道号（IN）：必填、存在性、列表内不重复。
 *
 * @param {string} - 待校验管道号。
 * @param {string} - 当前行 id（排除自身做重复校验）。
 * @param {PipelineItem[]} - 当前列表。
 * @returns {string} - 错误文案；通过时为空串。
 */
export const validateRoomPipeIn = (
	pipeIn: string,
	recordId: string,
	list: PipelineItem[],
): string => {
	const value = pipeIn.trim();
	if (!value) {
		return "请输入管道号";
	}
	if (!EXISTING_PIPE_IN_SET.has(value)) {
		return PIPE_IN_NOT_FOUND_MSG;
	}
	const duplicated = list.some(
		(item) => item.id !== recordId && item.pipeIn.trim() === value,
	);
	if (duplicated) {
		return PIPE_IN_DUPLICATE_MSG;
	}
	return "";
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
			pipeIn: sanitizePipeInInput(item.pipeIn ?? ""),
			status: item.status as PipelineStatus,
			configType: item.configType as PipelineConfigType,
		}));
};
