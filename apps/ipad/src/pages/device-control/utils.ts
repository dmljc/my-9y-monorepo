import { sortBuildingTabs } from "@/utils/buildingTabs";
import type {
	BuildingTab,
	DeviceItem,
	DeviceMetric,
	RoomDeviceItem,
	RoomDeviceRow,
	RuntimeParam,
	TabletWsDevice,
	TabletWsMessage,
} from "./interface";

/** 无实时数据时的占位指标（对齐稿面两卡）。 */
export const DEFAULT_METRICS: DeviceMetric[] = [
	{ key: "temperature", label: "温度", value: null, unit: "℃" },
	{ key: "flowRate", label: "流量", value: null, unit: "L/min" },
];

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
 * 解析 rooms 接口数组。
 *
 * @param {unknown} - listRooms 解包后的 data。
 * @returns {RoomDeviceRow[]} - 行数组。
 */
export const parseRoomRows = (data: unknown): RoomDeviceRow[] => {
	return Array.isArray(data) ? (data as RoomDeviceRow[]) : [];
};

/**
 * 格式化监控房展示。
 *
 * @param {string | undefined} - 后端 room。
 * @returns {string} - 展示文案。
 */
export const formatRoomLabel = (room?: string): string => {
	const value = room?.trim();
	if (!value || value === "-") return "—";
	return value;
};

/**
 * 将房间下的单台设备映射为列表项。
 *
 * @param {RoomDeviceRow} - 房间行。
 * @param {RoomDeviceItem} - 设备。
 * @returns {DeviceItem | null} - 设备；无 deviceId 时 null。
 */
export const mapRoomDeviceToItem = (
	room: RoomDeviceRow,
	device: RoomDeviceItem,
): DeviceItem | null => {
	const id = Number(device.deviceId ?? 0);
	if (!id) return null;

	return {
		id,
		code: String(device.deviceCode ?? "").trim() || `设备${id}`,
		name: String(device.deviceName ?? "").trim() || `设备${id}`,
		roomLabel: formatRoomLabel(room.room),
		/* 后端可能回 number / string；仅 "1" 表示已关闭 */
		enabled: String(device.deviceStatus ?? "") !== "1",
		cleaning: String(device.cleanStatus ?? "") === "1",
		buildingId: Number(room.buildingId ?? 0),
		thingId: String(device.thingId ?? "").trim(),
		metrics: [],
	};
};

/**
 * rooms 响应 → 设备列表（展开各房间 devices）。
 *
 * @param {unknown} - listRooms 解包后的 data。
 * @returns {DeviceItem[]} - 设备列表。
 */
export const parseDevicesFromRooms = (data: unknown): DeviceItem[] => {
	const devices: DeviceItem[] = [];
	for (const room of parseRoomRows(data)) {
		const list = Array.isArray(room.devices) ? room.devices : [];
		for (const device of list) {
			const item = mapRoomDeviceToItem(room, device);
			if (item) devices.push(item);
		}
	}
	return devices;
};

/**
 * 根据设备列表推断厂房总开关：全部关闭视为关，否则为开。
 *
 * @param {DeviceItem[]} - 当前厂房设备。
 * @returns {boolean} - 总开关是否开启。
 */
export const deriveMasterOn = (devices: DeviceItem[]): boolean => {
	if (!devices.length) return true;
	return devices.some((item) => item.enabled);
};

/**
 * 将 WebSocket runtimeParams 转为详情指标卡。
 *
 * @param {RuntimeParam[] | undefined} - 运行参数列表。
 * @returns {DeviceMetric[]} - 有数值的指标；最多取前 2 个对齐双卡布局。
 */
export const mapRuntimeParams = (
	params: RuntimeParam[] | undefined,
): DeviceMetric[] => {
	if (!Array.isArray(params)) return [];

	const metrics: DeviceMetric[] = [];
	for (const item of params) {
		const num = Number(item.value);
		if (!Number.isFinite(num)) continue;
		const key = String(item.displayField ?? "").trim();
		const label = String(item.label ?? "").trim();
		metrics.push({
			key: key || label || `metric-${metrics.length}`,
			label: label || key || "指标",
			value: num,
			unit: String(item.unit ?? "").trim(),
		});
		if (metrics.length >= 2) break;
	}
	return metrics;
};

/**
 * 解析平板 WebSocket 文本消息。
 *
 * @param {string} - 原始消息。
 * @returns {TabletWsMessage | null} - 合法消息；解析失败为 null。
 */
export const parseTabletWsMessage = (raw: string): TabletWsMessage | null => {
	try {
		const parsed = JSON.parse(raw) as TabletWsMessage;
		if (!parsed || typeof parsed !== "object") return null;
		return parsed;
	} catch {
		return null;
	}
};

/**
 * 从 WebSocket 消息提取设备列表。
 *
 * @param {TabletWsMessage | null} - 消息。
 * @returns {TabletWsDevice[]} - 设备数组。
 */
export const getTabletWsDevices = (
	message: TabletWsMessage | null,
): TabletWsDevice[] => {
	const list = message?.data?.devices;
	return Array.isArray(list) ? list : [];
};

/**
 * 详情区展示用指标：有实时数据用实时，否则用温度/流量占位。
 *
 * @param {DeviceMetric[]} - 设备上已缓存的实时指标。
 * @returns {DeviceMetric[]} - 用于渲染的指标列表。
 */
export const getDisplayMetrics = (metrics: DeviceMetric[]): DeviceMetric[] => {
	return metrics.length > 0 ? metrics : DEFAULT_METRICS;
};

/**
 * 指标展示文案。
 *
 * @param {number | null} - 数值。
 * @param {number} - 小数位。
 * @returns {string} - 展示字符串。
 */
export const formatMetric = (value: number | null, digits = 1): string => {
	if (value === null || !Number.isFinite(value)) return "—";
	return value.toFixed(digits);
};
