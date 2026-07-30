import { sortBuildingTabs } from "@/utils/buildingTabs";
import type {
	BuildingTab,
	DeviceItem,
	DeviceMetric,
	RealtimeSensor,
	RoomDeviceItem,
	RoomDeviceRow,
} from "./interface";

/** 实时数据轮询间隔（毫秒）。 */
export const REALTIME_POLL_MS = 5000;

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
		enabled: device.deviceStatus !== "1",
		cleaning: device.cleanStatus === "1",
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
 * 解析 realtime 接口数组。
 *
 * @param {unknown} - getRealtime 解包后的 data。
 * @returns {RealtimeSensor[]} - 传感器点。
 */
export const parseRealtimeSensors = (data: unknown): RealtimeSensor[] => {
	return Array.isArray(data) ? (data as RealtimeSensor[]) : [];
};

/**
 * 根据属性推断展示名与单位。
 *
 * @param {string} - propertyId。
 * @param {string} - propertyName。
 * @returns {{ label: string; unit: string }} - 展示元信息。
 */
const resolveMetricMeta = (
	propertyId: string,
	propertyName: string,
): { label: string; unit: string } => {
	const text = `${propertyId} ${propertyName}`;
	if (/temp|温度|temprature/i.test(text)) {
		return { label: propertyName || "温度", unit: "℃" };
	}
	if (/flow|流量|flow_rate|flowRate/i.test(text)) {
		return { label: propertyName || "流量", unit: "L/min" };
	}
	if (/conc|浓度|beta_act/i.test(text)) {
		return { label: propertyName || "浓度", unit: "" };
	}
	if (/level|液位/i.test(text)) {
		return { label: propertyName || "液位", unit: "" };
	}
	return { label: propertyName || propertyId || "指标", unit: "" };
};

/**
 * 将 realtime 传感器列表转为详情指标卡数据。
 *
 * @param {unknown} - getRealtime 解包后的 data。
 * @returns {DeviceMetric[]} - 有数值的指标；最多取前 2 个对齐双卡布局。
 */
export const mapRealtimeMetrics = (data: unknown): DeviceMetric[] => {
	const sensors = parseRealtimeSensors(data);
	const metrics: DeviceMetric[] = [];

	for (const item of sensors) {
		const num = Number(item.value);
		if (!Number.isFinite(num)) continue;
		const propertyId = String(item.propertyId ?? "").trim();
		const propertyName = String(item.propertyName ?? "").trim();
		const { label, unit } = resolveMetricMeta(propertyId, propertyName);
		metrics.push({
			key: propertyId || propertyName || `metric-${metrics.length}`,
			label,
			value: num,
			unit,
		});
		if (metrics.length >= 2) break;
	}

	return metrics;
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
