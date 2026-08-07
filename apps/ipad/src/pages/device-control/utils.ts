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

/**
 * 将单条 WS runtimeParam 转为指标卡。
 * 有限数字按数值展示；非数字字符串仍展示文案（value 置 null，由 formatMetric 旁路）。
 *
 * @param {RuntimeParam} - WS 运行参数项。
 * @param {number} - 列表序号，用于兜底 key。
 * @returns {DeviceMetric | null} - 指标；无 label/displayField 时 null。
 */
const toMetric = (
	item: RuntimeParam,
	index: number,
): DeviceMetric | null => {
	const key = String(item.displayField ?? "").trim();
	const label = String(item.label ?? "").trim();
	if (!key && !label) return null;

	const raw = item.value;
	const num = Number(raw);
	const hasNumber = raw !== "" && raw !== null && raw !== undefined && Number.isFinite(num);

	return {
		key: key || label || `metric-${index}`,
		label: label || key || "指标",
		value: hasNumber ? num : null,
		unit: String(item.unit ?? "").trim(),
		textValue:
			hasNumber || raw === undefined || raw === null
				? undefined
				: String(raw),
	};
};

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
 * 将 WebSocket runtimeParams 全量转为详情指标卡（顺序与推送一致，不写死字段）。
 *
 * @param {RuntimeParam[] | undefined} - 运行参数列表。
 * @returns {DeviceMetric[]} - 指标卡列表。
 */
export const mapRuntimeParams = (
	params: RuntimeParam[] | undefined,
): DeviceMetric[] => {
	if (!Array.isArray(params)) return [];

	const metrics: DeviceMetric[] = [];
	for (let i = 0; i < params.length; i += 1) {
		const metric = toMetric(params[i], i);
		if (metric) metrics.push(metric);
	}
	return metrics;
};

/**
 * 是否为平板实时数据 topic（tablet_init / tablet_data）。
 * topic 缺失但带 devices 时也放行（兼容只推 data 的帧）。
 *
 * @param {string | undefined} - 消息 topic。
 * @param {boolean} - 是否已解析出 devices。
 * @returns {boolean} - 是否消费。
 */
export const isTabletRealtimeTopic = (
	topic?: string,
	hasDevices = false,
): boolean => {
	const value = String(topic ?? "")
		.trim()
		.toLowerCase();
	if (value === "tablet_init" || value === "tablet_data") return true;
	return hasDevices && value === "";
};

/**
 * 规范化设备编码，用于 rooms 与 WS 对齐（deviceId 可能不一致）。
 *
 * @param {unknown} - 原始编码。
 * @returns {string} - 小写 trim 后的编码；空串表示无效。
 */
export const normalizeDeviceCode = (value: unknown): string => {
	return String(value ?? "")
		.trim()
		.toLowerCase();
};

/**
 * 用 WebSocket 设备快照合并列表项（名称、开关、清洗、运行参数）。
 * 注意：保留 rooms 的 deviceId，供开关/清洗接口使用。
 * runtimeParams 只要是数组就覆盖指标（无过程量时清空，避免串台残留）。
 *
 * @param {DeviceItem} - 当前列表项（rooms 接口）。
 * @param {TabletWsDevice} - WS 推送设备。
 * @returns {DeviceItem} - 合并后的设备。
 */
export const mergeDeviceFromWs = (
	item: DeviceItem,
	row: TabletWsDevice,
): DeviceItem => {
	const name = String(row.deviceName ?? "").trim();
	const code = String(row.deviceCode ?? "").trim();
	const hasStatus = row.deviceStatus !== undefined && row.deviceStatus !== null;
	const hasClean = row.cleanStatus !== undefined && row.cleanStatus !== null;
	const hasRuntimeParams = Array.isArray(row.runtimeParams);
	const metrics = hasRuntimeParams
		? mapRuntimeParams(row.runtimeParams)
		: item.metrics;

	return {
		...item,
		name: name || item.name,
		code: code || item.code,
		enabled: hasStatus
			? String(row.deviceStatus ?? "") !== "1"
			: item.enabled,
		cleaning: hasClean
			? String(row.cleanStatus ?? "") === "1"
			: item.cleaning,
		metrics,
	};
};

/**
 * 尝试把未知值解析成 JSON（兼容二次 stringify）。
 *
 * @param {unknown} - 原始值。
 * @returns {unknown} - 解析结果；失败返回原值。
 */
const unwrapJson = (value: unknown): unknown => {
	if (typeof value !== "string") return value;
	const text = value.trim();
	if (!text || (text[0] !== "{" && text[0] !== "[")) return value;
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return value;
	}
};

/**
 * 从任意结构中提取 devices 数组。
 * 兼容：
 * - { devices: [] }
 * - { data: { devices: [] } }
 * - { data: "\"{ devices: [] }\"" } / data 为 JSON 字符串
 * - { data: [] }（data 直接是设备数组）
 * - 根级即为设备数组
 *
 * @param {unknown} - 任意载荷。
 * @returns {TabletWsDevice[]} - 设备列表。
 */
export const extractTabletDevices = (value: unknown): TabletWsDevice[] => {
	const root = unwrapJson(value);
	if (Array.isArray(root)) {
		return root as TabletWsDevice[];
	}
	if (!root || typeof root !== "object") {
		return [];
	}

	const obj = root as Record<string, unknown>;
	if (Array.isArray(obj.devices)) {
		return obj.devices as TabletWsDevice[];
	}

	const data = unwrapJson(obj.data);
	if (Array.isArray(data)) {
		return data as TabletWsDevice[];
	}
	if (data && typeof data === "object") {
		const dataObj = data as Record<string, unknown>;
		if (Array.isArray(dataObj.devices)) {
			return dataObj.devices as TabletWsDevice[];
		}
	}

	return [];
};

/**
 * 解析平板 WebSocket 文本消息。
 * 兼容 data 对象 / JSON 字符串 / 设备数组等多种形态。
 *
 * @param {string} - 原始消息。
 * @returns {TabletWsMessage | null} - 合法消息；解析失败为 null。
 */
export const parseTabletWsMessage = (raw: string): TabletWsMessage | null => {
	try {
		const parsed = unwrapJson(raw);
		if (!parsed || typeof parsed !== "object") {
			return null;
		}
		const devices = extractTabletDevices(parsed);
		if (Array.isArray(parsed)) {
			return { data: { devices } };
		}
		const root = parsed as Record<string, unknown>;
		const topic =
			typeof root.topic === "string" ? root.topic : undefined;
		return {
			topic,
			data: { devices },
		};
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
 * 构建 WS 设备索引：deviceId / deviceCode / 唯一 deviceName。
 * rooms 与 WS 的 deviceId 经常不一致，需多键对齐。
 *
 * @param {TabletWsDevice[]} - WS 设备列表。
 * @returns {{ byId: Map<number, TabletWsDevice>; byCode: Map<string, TabletWsDevice>; byName: Map<string, TabletWsDevice> }} - 索引。
 */
export const indexTabletWsDevices = (devices: TabletWsDevice[]) => {
	const byId = new Map<number, TabletWsDevice>();
	const byCode = new Map<string, TabletWsDevice>();
	const nameCount = new Map<string, number>();

	for (const row of devices) {
		const id = Number(row.deviceId ?? 0);
		if (id) byId.set(id, row);
		const code = normalizeDeviceCode(row.deviceCode);
		if (code) byCode.set(code, row);
		const name = normalizeDeviceCode(row.deviceName);
		if (name) nameCount.set(name, (nameCount.get(name) ?? 0) + 1);
	}

	const byName = new Map<string, TabletWsDevice>();
	for (const row of devices) {
		const name = normalizeDeviceCode(row.deviceName);
		if (name && nameCount.get(name) === 1) {
			byName.set(name, row);
		}
	}

	return { byId, byCode, byName };
};

export type TabletWsDeviceIndex = ReturnType<typeof indexTabletWsDevices>;

/**
 * 在 WS 快照中查找与列表项对应的设备：deviceId → deviceCode → 唯一 deviceName。
 *
 * @param {DeviceItem} - rooms 列表项。
 * @param {TabletWsDeviceIndex} - WS 索引。
 * @returns {TabletWsDevice | undefined} - 命中的 WS 行。
 */
export const findWsDeviceForItem = (
	item: DeviceItem,
	index: TabletWsDeviceIndex,
): TabletWsDevice | undefined => {
	return (
		index.byId.get(item.id) ??
		index.byCode.get(normalizeDeviceCode(item.code)) ??
		index.byName.get(normalizeDeviceCode(item.name))
	);
};

/**
 * 指标卡主数值展示文案（原样输出后端值，不做小数位格式化）。
 *
 * @param {DeviceMetric} - 指标。
 * @returns {string} - 展示字符串。
 */
export const formatMetric = (metric: DeviceMetric): string => {
	if (metric.textValue !== undefined) {
		const text = metric.textValue.trim();
		return text || "—";
	}
	const { value } = metric;
	if (value === null || !Number.isFinite(value)) return "—";
	return String(value);
};
