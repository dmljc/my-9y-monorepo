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
	/** 房间号（房间配置）/ 取样房间号（设备配置，兼容旧字段）。 */
	sampleRoom: string;
	/** 管道号（IN），房间配置使用。 */
	pipeIn: string;
	/** 管道号（OUT），设备配置使用。 */
	pipeOut: string;
	/** 流量（L/min），设备配置使用；以字符串便于受控输入。 */
	flowRate: string;
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
	pipeOut: string;
	flowRate: string;
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
 * 设备编码 / 名称 / 房间号 / 管道号最大长度。
 */
export const MAX_LENGTH_40 = 40;

/**
 * 管路对应关系（客户提供，写死；管道号 → 房间号）。
 */
export const PIPELINE_ROOM_MAP: Record<string, string> = {
	"03": "102",
	"14": "211",
	"17": "302",
	"19": "314",
};

/**
 * 管道号下拉选项（与管路对应关系表一致）。
 */
export const PIPE_OPTIONS = Object.keys(PIPELINE_ROOM_MAP).map((pipeNo) => ({
	label: pipeNo,
	value: pipeNo,
}));

/**
 * 系统中已存在的管道号（对应关系表白名单；IN / OUT 共用）。
 */
export const EXISTING_PIPE_NO_SET = new Set(Object.keys(PIPELINE_ROOM_MAP));

/**
 * 根据管道号取对应房间号。
 *
 * @param {string} - 管道号。
 * @returns {string} - 房间号；未命中时为空串。
 */
export const getRoomByPipeNo = (pipeNo: string): string => {
	const key = pipeNo.trim();
	return PIPELINE_ROOM_MAP[key] ?? "";
};

/** 管道号不存在提示。 */
export const PIPE_NO_NOT_FOUND_MSG = "管道号不存在";

/** 管道号重复提示。 */
export const PIPE_NO_DUPLICATE_MSG = "管道号重复";

/** 管道号必填提示（展示在选择框内）。 */
export const PIPE_NO_REQUIRED_MSG = "请选择管道号";

/** 流量必填提示（展示在输入框内）。 */
export const FLOW_RATE_REQUIRED_MSG = "请输入流量";

/** 流量范围错误提示。 */
export const FLOW_RATE_RANGE_MSG = "流量超限";

/** 流量最小值。 */
export const FLOW_RATE_MIN = 0;

/** 流量最大值。 */
export const FLOW_RATE_MAX = 999999.99;

/**
 * 仅保留数字字符（管道号）。
 *
 * @param {string} - 原始输入。
 * @returns {string} - 过滤后的数字串。
 */
export const sanitizePipeNoInput = (value: string): string => {
	return value.replace(/\D/g, "");
};

/**
 * 流量输入过滤：数字 + 至多一个小数点，小数最多两位。
 *
 * @param {string} - 原始输入。
 * @returns {string} - 过滤后的流量字符串。
 */
export const sanitizeFlowRateInput = (value: string): string => {
	let next = value.replace(/[^\d.]/g, "");
	const dotIndex = next.indexOf(".");
	if (dotIndex !== -1) {
		const intPart = next.slice(0, dotIndex).replace(/\./g, "");
		const decPart = next
			.slice(dotIndex + 1)
			.replace(/\./g, "")
			.slice(0, 2);
		next = `${intPart}.${decPart}`;
	}
	const [intRaw = "", decRaw] = next.split(".");
	const intPart = intRaw.slice(0, 6);
	if (decRaw !== undefined) {
		return `${intPart}.${decRaw}`;
	}
	return intPart;
};

/**
 * 校验管道号：必填、存在性、列表内同字段不重复。
 *
 * @param {string} - 待校验管道号。
 * @param {string} - 当前行 id（排除自身做重复校验）。
 * @param {PipelineItem[]} - 当前列表。
 * @param {"pipeIn" | "pipeOut"} - 校验字段。
 * @returns {string} - 错误文案；通过时为空串。
 */
export const validatePipeNo = (
	pipeNo: string,
	recordId: string,
	list: PipelineItem[],
	field: "pipeIn" | "pipeOut",
): string => {
	const value = pipeNo.trim();
	if (!value) {
		return PIPE_NO_REQUIRED_MSG;
	}
	if (!EXISTING_PIPE_NO_SET.has(value)) {
		return PIPE_NO_NOT_FOUND_MSG;
	}
	const duplicated = list.some(
		(item) => item.id !== recordId && item[field].trim() === value,
	);
	if (duplicated) {
		return PIPE_NO_DUPLICATE_MSG;
	}
	return "";
};

/**
 * 校验房间管道号（IN）。
 *
 * @param {string} - 待校验管道号。
 * @param {string} - 当前行 id。
 * @param {PipelineItem[]} - 当前列表。
 * @returns {string} - 错误文案；通过时为空串。
 */
export const validateRoomPipeIn = (
	pipeIn: string,
	recordId: string,
	list: PipelineItem[],
): string => {
	return validatePipeNo(pipeIn, recordId, list, "pipeIn");
};

/**
 * 校验设备管道号（OUT）。
 *
 * @param {string} - 待校验管道号。
 * @param {string} - 当前行 id。
 * @param {PipelineItem[]} - 当前列表。
 * @returns {string} - 错误文案；通过时为空串。
 */
export const validateDevicePipeOut = (
	pipeOut: string,
	recordId: string,
	list: PipelineItem[],
): string => {
	return validatePipeNo(pipeOut, recordId, list, "pipeOut");
};

/**
 * 校验流量：必填、0.00～999999.99、最多两位小数。
 *
 * @param {string} - 待校验流量。
 * @returns {string} - 错误文案；通过时为空串。
 */
export const validateFlowRate = (flowRate: string): string => {
	const value = flowRate.trim();
	if (!value) {
		return FLOW_RATE_REQUIRED_MSG;
	}
	if (!/^\d+(\.\d{1,2})?$/.test(value)) {
		return FLOW_RATE_RANGE_MSG;
	}
	const num = Number(value);
	if (Number.isNaN(num) || num < FLOW_RATE_MIN || num > FLOW_RATE_MAX) {
		return FLOW_RATE_RANGE_MSG;
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
		.map((item) => {
			const raw = item as PipelineItem & {
				pipeOut?: string;
				flowRate?: string | number;
			};
			return {
				...item,
				pipeIn: sanitizePipeNoInput(raw.pipeIn ?? ""),
				pipeOut: sanitizePipeNoInput(raw.pipeOut ?? ""),
				flowRate:
					raw.flowRate === undefined || raw.flowRate === null
						? ""
						: String(raw.flowRate),
				status: item.status as PipelineStatus,
				configType: item.configType as PipelineConfigType,
			};
		});
};
