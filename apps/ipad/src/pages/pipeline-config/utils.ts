import { sortBuildingTabs } from "@/utils/buildingTabs";
import type {
	BuildingTab,
	PipelineItem,
	PipelineOptionRow,
	PipeOption,
	RoomPipelineRow,
} from "./interface";

/** 管道号不存在提示。 */
export const PIPE_NO_NOT_FOUND_MSG = "管道号不存在";

/** 管道号重复提示。 */
export const PIPE_NO_DUPLICATE_MSG = "管道号重复";

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
 * 解析管道 options 数组。
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
		sampleRoom: formatRoom(row.room),
		pipeIn: String(row.pipelineId ?? "").trim(),
		buildingId: Number(row.buildingId ?? buildingId),
	};
};

/**
 * 由管道 options 构建下拉选项。
 *
 * @param {unknown} - options 接口解包后的 data。
 * @returns {PipeOption[]} - 下拉选项。
 */
export const buildPipeOptionsFromData = (data: unknown): PipeOption[] => {
	const rows = parseArrayData<PipelineOptionRow>(data);
	const options: PipeOption[] = [];
	const seen = new Set<string>();

	for (const row of rows) {
		const pipeNo = String(row.pipelineId ?? "").trim();
		if (!pipeNo || seen.has(pipeNo)) continue;
		seen.add(pipeNo);
		options.push({ label: pipeNo, value: pipeNo });
	}

	return options;
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
	const value = pipeIn.trim();
	if (!value) {
		return "";
	}
	if (existingPipes.size > 0 && !existingPipes.has(value)) {
		return PIPE_NO_NOT_FOUND_MSG;
	}
	const duplicated = list.some(
		(item) => item.id !== recordId && item.pipeIn.trim() === value,
	);
	if (duplicated) {
		return PIPE_NO_DUPLICATE_MSG;
	}
	return "";
};
