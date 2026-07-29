import { sortBuildingTabs } from "@/utils/buildingTabs";
import type {
	BuildingTab,
	DevicePipelineRow,
	PipelineConfigType,
	PipelineItem,
	PipelineOptionRow,
	PipeOption,
	RoomPipelineRow,
} from "./interface";

/**
 * 管道配置分段选项。
 */
export const CONFIG_TYPE_OPTIONS: {
	key: PipelineConfigType;
	label: string;
}[] = [
	{ key: "device", label: "设备管道配置" },
	{ key: "room", label: "房间管道配置" },
];

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
 * 将厂房接口响应转为顶栏 Tab。
 *
 * @param {unknown} - `/iiot/alarm/buildings` 解包后的 data。
 * @returns {BuildingTab[]} - 厂房 Tab 列表。
 */
export const normalizeBuildingTabs = (data: unknown): BuildingTab[] => {
	if (!Array.isArray(data)) return [];

	const tabs: BuildingTab[] = [];
	for (const item of data) {
		if (!item || typeof item !== "object") continue;
		const record = item as Record<string, unknown>;
		const buildingId = Number(record.id ?? record.buildingId ?? 0);
		const building = String(record.building ?? "").trim();
		if (!buildingId || !building) continue;
		tabs.push({
			key: String(buildingId),
			label: building,
			buildingId,
			building,
		});
	}
	return sortBuildingTabs(tabs);
};

/**
 * 解析房间管道 list 接口 data.list。
 *
 * @param {unknown} - list 接口解包后的 data。
 * @returns {RoomPipelineRow[]} - 行数组。
 */
export const parseRoomPipelineList = (data: unknown): RoomPipelineRow[] => {
	if (Array.isArray(data)) return data as RoomPipelineRow[];
	if (!data || typeof data !== "object") return [];
	const list = (data as { list?: unknown }).list;
	return Array.isArray(list) ? (list as RoomPipelineRow[]) : [];
};

/**
 * 解析设备管道 list / options 数组。
 *
 * @param {unknown} - 接口解包后的 data。
 * @returns {T[]} - 行数组。
 */
export const parseArrayData = <T>(data: unknown): T[] => {
	return Array.isArray(data) ? (data as T[]) : [];
};

/**
 * 格式化房间号展示。
 *
 * @param {string | undefined} - 后端 room。
 * @returns {string} - 展示文案。
 */
export const formatRoom = (room?: string): string => {
	const value = room?.trim();
	if (!value || value === "-") return "";
	return value;
};

/**
 * 流量转受控输入字符串。
 *
 * @param {number | string | null | undefined} - 后端 flowRate。
 * @returns {string} - 输入框值。
 */
export const formatFlowRate = (flowRate?: number | string | null): string => {
	if (flowRate === undefined || flowRate === null || flowRate === "") {
		return "";
	}
	return String(flowRate);
};

/**
 * 将房间管道配置行映射为表格行。
 *
 * @param {RoomPipelineRow} - 接口行。
 * @param {number} - 当前厂房 ID。
 * @returns {PipelineItem | null} - 表格行；缺 id 时跳过。
 */
export const mapRoomRowToItem = (
	row: RoomPipelineRow,
	buildingId: number,
): PipelineItem | null => {
	const id = Number(row.id ?? 0);
	const roomId = Number(row.roomId ?? 0);
	if (!id || !roomId) return null;
	return {
		id,
		configId: id,
		roomId,
		deviceCode: "",
		deviceName: "",
		sampleRoom: formatRoom(row.room),
		pipeIn: String(row.pipelineId ?? "").trim(),
		pipeOut: "",
		flowRate: "",
		buildingId: Number(row.buildingId ?? buildingId),
		configType: "room",
	};
};

/**
 * 将设备管道配置行映射为表格行。
 *
 * @param {DevicePipelineRow} - 接口行。
 * @param {number} - 当前厂房 ID。
 * @returns {PipelineItem | null} - 表格行；缺 id 时跳过。
 */
export const mapDeviceRowToItem = (
	row: DevicePipelineRow,
	buildingId: number,
): PipelineItem | null => {
	const id = Number(row.id ?? 0);
	if (!id) return null;
	return {
		id,
		deviceId: id,
		deviceCode: row.deviceCode ?? "",
		deviceName: row.deviceName ?? "",
		sampleRoom: formatRoom(row.room),
		pipeIn: "",
		pipeOut: String(row.pipelineId ?? "").trim(),
		flowRate: formatFlowRate(row.flowRate),
		buildingId,
		configType: "device",
	};
};

/**
 * 由管道 options 构建下拉选项与「管道号 → 房间号」映射。
 *
 * @param {unknown} - options 接口解包后的 data。
 * @returns {{ options: PipeOption[]; roomByPipe: Record<string, string> }} - 下拉与映射。
 */
export const buildPipeOptionsFromData = (
	data: unknown,
): { options: PipeOption[]; roomByPipe: Record<string, string> } => {
	const rows = parseArrayData<PipelineOptionRow>(data);
	const roomByPipe: Record<string, string> = {};
	const options: PipeOption[] = [];
	const seen = new Set<string>();

	for (const row of rows) {
		const pipeNo = String(row.pipelineId ?? "").trim();
		if (!pipeNo || seen.has(pipeNo)) continue;
		seen.add(pipeNo);
		roomByPipe[pipeNo] = formatRoom(row.room);
		options.push({ label: pipeNo, value: pipeNo });
	}

	return { options, roomByPipe };
};

/**
 * 根据管道号取对应房间号。
 *
 * @param {string} - 管道号。
 * @param {Record<string, string>} - 管道号 → 房间号映射。
 * @returns {string} - 房间号；未命中时为空串。
 */
export const getRoomByPipeNo = (
	pipeNo: string,
	roomByPipe: Record<string, string>,
): string => {
	const key = pipeNo.trim();
	return roomByPipe[key] ?? "";
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
 * 校验管道号：允许为空；有值时校验存在性、列表内同字段不重复。
 *
 * @param {string} - 待校验管道号。
 * @param {number} - 当前行 id（排除自身做重复校验）。
 * @param {PipelineItem[]} - 当前列表。
 * @param {"pipeIn" | "pipeOut"} - 校验字段。
 * @param {Set<string>} - 合法管道号集合。
 * @returns {string} - 错误文案；通过时为空串。
 */
export const validatePipeNo = (
	pipeNo: string,
	recordId: number,
	list: PipelineItem[],
	field: "pipeIn" | "pipeOut",
	existingPipes: Set<string>,
): string => {
	const value = pipeNo.trim();
	if (!value) {
		return "";
	}
	if (existingPipes.size > 0 && !existingPipes.has(value)) {
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
 * @param {number} - 当前行 id。
 * @param {PipelineItem[]} - 当前列表。
 * @param {Set<string>} - 合法管道号集合。
 * @returns {string} - 错误文案；通过时为空串。
 */
export const validateRoomPipeIn = (
	pipeIn: string,
	recordId: number,
	list: PipelineItem[],
	existingPipes: Set<string>,
): string => {
	if (!pipeIn.trim()) {
		return "";
	}
	return validatePipeNo(pipeIn, recordId, list, "pipeIn", existingPipes);
};

/**
 * 校验设备管道号（OUT）。
 *
 * @param {string} - 待校验管道号。
 * @param {number} - 当前行 id。
 * @param {PipelineItem[]} - 当前列表。
 * @param {Set<string>} - 合法管道号集合。
 * @returns {string} - 错误文案；通过时为空串。
 */
export const validateDevicePipeOut = (
	pipeOut: string,
	recordId: number,
	list: PipelineItem[],
	existingPipes: Set<string>,
): string => {
	return validatePipeNo(pipeOut, recordId, list, "pipeOut", existingPipes);
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
