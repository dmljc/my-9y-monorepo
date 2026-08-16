import { sortBuildingTabs } from "@/utils/buildingTabs";
import type {
	BuildingTab,
	PipelineItem,
	PipeOption,
	RoomOption,
	RoomPipelineRow,
} from "./interface";

/** 列表默认每页条数。 */
export const DEFAULT_PAGE_SIZE = 10;

/** 列表每页条数可选项。 */
export const PAGE_SIZE_OPTIONS = ["10", "15", "20", "25", "50", "100"];

/** 管道号（IN）下拉选项：1～26。 */
export const PIPE_IN_OPTIONS: PipeOption[] = Array.from(
	{ length: 26 },
	(_, index) => {
		const value = String(index + 1);
		return { label: value, value };
	},
);

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
 * 将厂房房间接口响应转为下拉选项。
 *
 * @param {unknown} - `/iiot/alarm/rooms` 解包后的 data。
 * @returns {RoomOption[]} - value 为房间 ID，label 为房间号。
 */
export const buildRoomOptions = (data: unknown): RoomOption[] => {
	const rows = Array.isArray(data)
		? data
		: data && typeof data === "object"
			? ((data as { list?: unknown; rooms?: unknown }).list ??
				(data as { rooms?: unknown }).rooms)
			: [];
	if (!Array.isArray(rows)) return [];

	const options: RoomOption[] = [];
	const seen = new Set<string>();
	for (const item of rows) {
		if (typeof item === "string" && item.trim()) {
			const value = item.trim();
			if (seen.has(value)) continue;
			seen.add(value);
			options.push({ label: value, value });
			continue;
		}
		if (!item || typeof item !== "object") continue;
		const record = item as Record<string, unknown>;
		const value = String(
			record.roomId ?? record.id ?? record.value ?? "",
		).trim();
		const label = String(
			record.room ?? record.roomName ?? record.name ?? record.label ?? value,
		).trim();
		if (!value || seen.has(value)) continue;
		seen.add(value);
		options.push({ label, value });
	}
	return options;
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
