import { sortBuildingTabs } from "@/utils/buildingTabs";
import type {
	BuildingTab,
	DeviceDetailRow,
	DeviceItem,
	DeviceMetric,
	DeviceTrendChartData,
	DeviceTrendPoint,
	DeviceTrendSeriesItem,
	ListMode,
	RoomDeviceInfo,
	RoomDeviceItem,
	RoomDeviceRow,
	RoomGroup,
	RoomTrendSeriesItem,
	RuntimeParam,
	SelectOption,
	TabletWsDevice,
	TabletWsMessage,
} from "./interface";

/**
 * 左侧列表切换选项。
 */
export const LIST_MODE_OPTIONS: { key: ListMode; label: string }[] = [
	{ key: "device", label: "设备" },
	{ key: "room", label: "房间" },
];

/**
 * 后端 deviceStatus：0 关闭 / 1 运行。
 */
export const DEVICE_STATUS = {
	CLOSED: "0",
	RUNNING: "1",
} as const;

/**
 * 是否为运行中（仅 deviceStatus === "1"）。
 *
 * @param {string | number | undefined} - 后端状态码。
 * @returns {boolean} - 是否已开启。
 */
export const isDeviceRunning = (deviceStatus?: string | number): boolean => {
	return String(deviceStatus ?? "") === DEVICE_STATUS.RUNNING;
};

/**
 * 是否处于清洗中。兼容 WS / 列表接口的 boolean、1、"1"、"true"。
 *
 * @param {string | number | boolean | undefined} - cleanStatus。
 * @returns {boolean} - 是否清洗中。
 */
export const isDeviceCleaning = (
	cleanStatus?: string | number | boolean,
): boolean => {
	if (cleanStatus === true || cleanStatus === 1) return true;
	const value = String(cleanStatus ?? "")
		.trim()
		.toLowerCase();
	return value === "1" || value === "true";
};

/**
 * 实时指标卡图标类型。
 */
export type MetricIconKey =
	| "flow"
	| "pressure"
	| "concentration"
	| "velocity"
	| "temperature";

/**
 * 指标名称到设计稿图标的匹配表。
 */
const METRIC_ICON_MATCHERS: { test: RegExp; key: MetricIconKey }[] = [
	{ test: /流量/, key: "flow" },
	{ test: /压力/, key: "pressure" },
	{ test: /浓度/, key: "concentration" },
	{ test: /流速/, key: "velocity" },
	{ test: /温度/, key: "temperature" },
];

/**
 * 将单条 WS runtimeParam 转为指标卡。
 * 有限数字按数值展示；非数字字符串仍展示文案（value 置 null，由 formatMetric 旁路）。
 *
 * @param {RuntimeParam} - WS 运行参数项。
 * @param {number} - 列表序号，用于兜底 key。
 * @returns {DeviceMetric | null} - 指标；无 propertyId/label/displayField 时 null。
 */
const toMetric = (item: RuntimeParam, index: number): DeviceMetric | null => {
	const propertyId = String(item.propertyId ?? "").trim();
	const displayField = String(item.displayField ?? "").trim();
	const label = String(item.label ?? "").trim();
	if (!propertyId && !displayField && !label) return null;

	const raw = item.value;
	const num = Number(raw);
	const hasNumber =
		raw !== "" && raw !== null && raw !== undefined && Number.isFinite(num);

	return {
		key: propertyId || displayField || label || `metric-${index}`,
		propertyId,
		label: label || propertyId || displayField || "指标",
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
 * 将后端物实例字段解析为多选值（兼容逗号串 / 字符串数组）。
 *
 * @param {unknown} - thingId 字符串、thingIds 数组，或其它。
 * @returns {string[]} - 物实例 ID 列表。
 */
export const parseThingIds = (value?: unknown): string[] => {
	if (Array.isArray(value)) {
		return [
			...new Set(
				value.map((item) => String(item ?? "").trim()).filter(Boolean),
			),
		];
	}
	if (typeof value === "string") {
		if (!value.trim()) return [];
		return [
			...new Set(
				value
					.split(/[,，]/)
					.map((item) => item.trim())
					.filter(Boolean),
			),
		];
	}
	return [];
};

/**
 * 将多选物实例 ID 序列化为逗号分隔字符串。
 *
 * @param {string[] | undefined} - 物实例 ID 列表。
 * @returns {string} - 逗号分隔字符串。
 */
export const joinThingIds = (thingIds?: string[]): string => {
	if (!Array.isArray(thingIds)) return "";
	return [
		...new Set(thingIds.map((item) => item.trim()).filter(Boolean)),
	].join(",");
};

/**
 * 解析设备详情（兼容 `{ device, thingIds }` 与扁平旧结构）。
 *
 * @param {unknown} - `/iiot/tablet/ledger/{id}` 解包后的 data。
 * @returns {{ device: DeviceDetailRow; thingIds: string[] }} - 设备字段与物实例列表。
 */
export const parseDeviceDetail = (
	data: unknown,
): { device: DeviceDetailRow; thingIds: string[] } => {
	if (!data || typeof data !== "object") {
		return { device: {}, thingIds: [] };
	}
	const record = data as Record<string, unknown>;
	const nestedDevice =
		record.device && typeof record.device === "object"
			? (record.device as DeviceDetailRow)
			: null;
	const device = nestedDevice ?? (record as DeviceDetailRow);
	const thingIds = parseThingIds(
		record.thingIds ??
			record.thingId ??
			nestedDevice?.thingId ??
			device.thingIds,
	);
	return { device, thingIds };
};

/**
 * 解析房间配置详情。
 *
 * @param {unknown} - `/iiot/tablet/pipeline/device/{deviceId}` 解包后的 data。
 * @returns {RoomDeviceInfo} - 房间、流量与设备字段。
 */
export const parseRoomDeviceInfo = (data: unknown): RoomDeviceInfo => {
	if (!data || typeof data !== "object") return {};
	const record = data as Record<string, unknown>;
	const flowRaw = record.flowRate;
	const flowNum = Number(flowRaw);
	const hasFlow =
		flowRaw !== "" &&
		flowRaw !== null &&
		flowRaw !== undefined &&
		Number.isFinite(flowNum);

	return {
		deviceId: Number(record.deviceId ?? 0) || undefined,
		deviceCode: String(record.deviceCode ?? "").trim() || undefined,
		deviceName: String(record.deviceName ?? "").trim() || undefined,
		flowRate: hasFlow ? flowNum : null,
		roomId: Number(record.roomId ?? 0) || undefined,
		room: String(record.room ?? "").trim() || undefined,
	};
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

	const flowRaw = Number(device.flowRate);
	const flowRate = Number.isFinite(flowRaw) ? flowRaw : null;

	return {
		id,
		deviceId: id,
		code: String(device.deviceCode ?? "").trim() || `设备${id}`,
		name: String(device.deviceName ?? "").trim() || `设备${id}`,
		roomLabel: formatRoomLabel(room.room),
		roomId: Number(room.roomId ?? 0),
		pipeNo: String(device.pipelineId ?? room.pipelineId ?? "").trim(),
		flowRate:
			flowRate !== null && Number.isFinite(flowRate) ? flowRate : null,
		manufacturer: String(device.manufacturer ?? "").trim(),
		/* 后端可能回 number / string；仅 "1" 表示运行中 */
		enabled: isDeviceRunning(device.deviceStatus),
		cleaning: isDeviceCleaning(device.cleanStatus),
		buildingId: Number(room.buildingId ?? 0),
		thingId:
			joinThingIds(parseThingIds(device.thingIds ?? device.thingId)) ||
			String(device.thingId ?? "").trim(),
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
 * 从当前设备/房间的 runtimeParams 指标中解析趋势查询用的 propertyId。
 * 数组为空时返回空串，避免沿用上一台设备残留的点位。
 *
 * @param {DeviceMetric[]} - 当前设备或房间的实时指标。
 * @param {string} - 用户选中的点位；仍存在于指标中时优先使用。
 * @returns {string} - 趋势接口 propertyId；无过程量时为空串。
 */
export const resolveTrendPropertyId = (
	metrics: DeviceMetric[],
	preferredId = "",
): string => {
	if (!metrics.length) return "";
	if (preferredId && metrics.some((item) => item.propertyId === preferredId)) {
		return preferredId;
	}
	return metrics.find((item) => item.propertyId)?.propertyId ?? "";
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
 * 用 WebSocket 设备快照合并列表项（名称、开关、清洗、管道编号、运行参数）。
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
	const hasStatus =
		row.deviceStatus !== undefined && row.deviceStatus !== null;
	const hasClean = row.cleanStatus !== undefined && row.cleanStatus !== null;
	const hasRuntimeParams = Array.isArray(row.runtimeParams);
	const metrics = hasRuntimeParams
		? mapRuntimeParams(row.runtimeParams)
		: item.metrics;
	const pipelineId = String(row.pipelineId ?? "").trim();

	return {
		...item,
		name: name || item.name,
		code: code || item.code,
		pipeNo: pipelineId || item.pipeNo,
		enabled: hasStatus ? isDeviceRunning(row.deviceStatus) : item.enabled,
		cleaning: hasClean ? isDeviceCleaning(row.cleanStatus) : item.cleaning,
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
		const topic = typeof root.topic === "string" ? root.topic : undefined;
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

/**
 * WebSocket 设备索引（deviceId / deviceCode / 唯一 deviceName）。
 */
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
		index.byId.get(item.deviceId) ??
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

/**
 * 空文案展示为破折号。
 *
 * @param {string | undefined} - 原始文案。
 * @returns {string} - 展示字符串。
 */
export const displayDash = (value?: string): string => {
	const text = String(value ?? "").trim();
	return text && text !== "—" ? text : "—";
};

/**
 * 取出设备列表中的有效编码。
 *
 * @param {DeviceItem[]} - 设备列表。
 * @returns {string[]} - 去空后的编码。
 */
export const getDeviceCodes = (devices: DeviceItem[]): string[] => {
	return devices.map((item) => item.code.trim()).filter(Boolean);
};

/**
 * 拼接全部设备编码（右侧房间信息）。
 *
 * @param {DeviceItem[]} - 设备列表。
 * @returns {string} - 顿号连接的完整编码。
 */
export const joinDeviceCodes = (devices: DeviceItem[]): string => {
	return getDeviceCodes(devices).join("、");
};

/**
 * 取出设备列表中的有效名称。
 *
 * @param {DeviceItem[]} - 设备列表。
 * @returns {string[]} - 去空后的名称。
 */
export const getDeviceNames = (devices: DeviceItem[]): string[] => {
	return devices.map((item) => item.name.trim()).filter(Boolean);
};

/**
 * 拼接全部设备名称（右侧房间信息）。
 *
 * @param {DeviceItem[]} - 设备列表。
 * @returns {string} - 顿号连接的完整名称。
 */
export const joinDeviceNames = (devices: DeviceItem[]): string => {
	return getDeviceNames(devices).join("、");
};

/**
 * 左侧房间卡片编码预览：多个时只展示第一个并加省略号。
 *
 * @param {DeviceItem[]} - 设备列表。
 * @returns {string} - 预览文案。
 */
export const previewDeviceCodes = (devices: DeviceItem[]): string => {
	const codes = getDeviceCodes(devices);
	if (codes.length === 0) return "";
	if (codes.length === 1) return codes[0];
	return `${codes[0]}...`;
};

/** 流量最小值。 */
export const FLOW_RATE_MIN = 0;

/** 流量最大值。 */
export const FLOW_RATE_MAX = 999999.99;

/** 物实例下拉查询条数。 */
export const THING_LIST_LIMIT = 100;

/** 物实例下拉查询偏移。 */
export const THING_LIST_OFFSET = 0;

/**
 * 将未知列表规范为数组。
 *
 * @param {unknown} - 接口 data。
 * @returns {unknown[]} - 数组。
 */
const toArray = (data: unknown): unknown[] => {
	if (Array.isArray(data)) return data;
	if (!data || typeof data !== "object") return [];
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.list)) return record.list;
	if (Array.isArray(record.rows)) return record.rows;
	if (Array.isArray(record.rooms)) return record.rooms;
	return [];
};

/**
 * 将房间列表接口响应转为 Select 选项（value 为房间 ID）。
 *
 * @param {unknown} - `/iiot/alarm/rooms` 解包后的 data。
 * @returns {SelectOption[]} - 下拉选项。
 */
export const normalizeRoomOptions = (data: unknown): SelectOption[] => {
	const options: SelectOption[] = [];
	const seen = new Set<string>();
	for (const item of toArray(data)) {
		if (typeof item === "string" && item.trim()) {
			if (seen.has(item)) continue;
			seen.add(item);
			options.push({ label: item, value: item });
			continue;
		}
		if (!item || typeof item !== "object") continue;
		const record = item as Record<string, unknown>;
		const value = String(
			record.value ??
				record.roomId ??
				record.id ??
				record.room ??
				record.roomName ??
				record.name ??
				record.label ??
				"",
		).trim();
		if (!value || seen.has(value)) continue;
		seen.add(value);
		options.push({
			label: String(
				record.label ??
					record.room ??
					record.roomName ??
					record.name ??
					record.roomNo ??
					value,
			).trim(),
			value,
		});
	}
	return options;
};

/**
 * 规范化 things 接口返回。
 *
 * @param {unknown} - `/iiot/device-control/things` 解包后的 data。
 * @returns {unknown[]} - 物实例数组。
 */
export const normalizeThingsList = (data: unknown): unknown[] => {
	if (Array.isArray(data)) return data;
	if (!data || typeof data !== "object") return [];
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.things)) return record.things;
	if (record.data && typeof record.data === "object") {
		const nested = record.data as Record<string, unknown>;
		if (Array.isArray(nested.things)) return nested.things;
		if (Array.isArray(record.data)) return record.data;
	}
	return toArray(data);
};

/**
 * 物实例 → 下拉选项（label=thing_name[thing_id]，value=thing_id）。
 *
 * @param {unknown} - things 接口 data。
 * @returns {SelectOption[]} - 下拉选项。
 */
export const toThingOptions = (data: unknown): SelectOption[] => {
	return normalizeThingsList(data).flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const record = item as Record<string, unknown>;
		const value = String(record.thing_id ?? record.thingId ?? "").trim();
		if (!value) return [];
		const name = String(record.thing_name ?? record.thingName ?? "").trim();
		return [{ label: name ? `${name}【${value}】` : value, value }];
	});
};

/**
 * 把当前回显值补进选项，避免下拉尚未加载时空白。
 *
 * @param {SelectOption[]} - 已有选项。
 * @param {string | undefined} - 回显 value。
 * @param {string | undefined} - 回显 label。
 * @returns {SelectOption[]} - 合并后的选项。
 */
export const mergeSelectOption = (
	options: SelectOption[],
	value?: string,
	label?: string,
): SelectOption[] => {
	const text = String(value ?? "").trim();
	if (!text) return options;
	if (options.some((item) => item.value === text)) return options;
	return [
		{ label: String(label ?? "").trim() || text, value: text },
		...options,
	];
};

/**
 * 按房间聚合设备列表（保持 rooms 接口顺序）。
 * 无 `roomId` 的设备不进入房间列表（如「未分配房间」）。
 *
 * @param {DeviceItem[]} - 设备列表。
 * @returns {RoomGroup[]} - 房间分组。
 */
export const groupDevicesByRoom = (devices: DeviceItem[]): RoomGroup[] => {
	const groups: RoomGroup[] = [];
	const indexByKey = new Map<string, number>();

	for (const item of devices) {
		if (!item.roomId) continue;
		const key = String(item.roomId);
		const existing = indexByKey.get(key);
		if (existing !== undefined) {
			groups[existing].devices.push(item);
			if (!groups[existing].pipeNo && item.pipeNo) {
				groups[existing].pipeNo = item.pipeNo;
			}
			continue;
		}
		indexByKey.set(key, groups.length);
		groups.push({
			key,
			roomId: item.roomId,
			roomLabel: item.roomLabel,
			pipeNo: item.pipeNo,
			devices: [item],
		});
	}
	return groups;
};

/**
 * 按指标名称匹配设计稿图标。
 *
 * @param {string} - 指标名称。
 * @returns {MetricIconKey} - 图标类型。
 */
export const getMetricIconKey = (label: string): MetricIconKey => {
	const text = String(label ?? "").trim();
	for (const item of METRIC_ICON_MATCHERS) {
		if (item.test.test(text)) return item.key;
	}
	return "flow";
};

/**
 * 房间折线滑块默认选中窗口（毫秒），与图表「1天」一致。
 */
export const TREND_SLIDER_RANGE_MS = 24 * 60 * 60 * 1000;

/**
 * 设备折线 X 轴可见窗口（毫秒），与 LineChartsByDevice 默认 1 小时一致。
 */
export const TREND_AXIS_RANGE_MS = 60 * 60 * 1000;

/**
 * 折线图抽稀上限，避免类目轴点过多。
 */
const TREND_MAX_POINTS = 310;

/**
 * 空趋势图占位。
 */
export const EMPTY_TREND_CHART: DeviceTrendChartData = {
	series: [],
};

/**
 * 将未知时间字段转为毫秒时间戳。
 *
 * @param {unknown} - 毫秒、秒或日期字符串。
 * @returns {number} - 毫秒时间戳；无法解析时为 NaN。
 */
const toTrendTime = (raw: unknown): number => {
	if (typeof raw === "number" && Number.isFinite(raw)) {
		return raw > 0 && raw < 1e12 ? raw * 1000 : raw;
	}
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (!trimmed) return Number.NaN;
		const numeric = Number(trimmed);
		if (Number.isFinite(numeric)) {
			return numeric > 0 && numeric < 1e12 ? numeric * 1000 : numeric;
		}
		const parsed = Date.parse(trimmed);
		return Number.isNaN(parsed) ? Number.NaN : parsed;
	}
	return Number.NaN;
};

/**
 * 解析单个趋势点。
 *
 * @param {unknown} - 对象或 `[time, value]`。
 * @returns {DeviceTrendPoint | null} - 有效点；否则 null。
 */
const parseTrendPoint = (item: unknown): DeviceTrendPoint | null => {
	if (Array.isArray(item) && item.length >= 2) {
		const time = toTrendTime(item[0]);
		const value = Number(item[1]);
		if (Number.isFinite(time) && Number.isFinite(value)) {
			return { time, value };
		}
		return null;
	}
	if (!item || typeof item !== "object") return null;
	const record = item as Record<string, unknown>;
	const time = toTrendTime(
		record.time ??
			record.timestamp ??
			record.ts ??
			record.dataTime ??
			record.t ??
			record.x,
	);
	const value = Number(record.value ?? record.y ?? record.val ?? record.v);
	if (!Number.isFinite(time) || !Number.isFinite(value)) return null;
	return { time, value };
};

/**
 * 从数组中提取趋势点（点数组或分段数组）。
 *
 * @param {unknown[]} - 原始数组。
 * @returns {DeviceTrendPoint[]} - 点列表。
 */
const parseTrendPointList = (list: unknown[]): DeviceTrendPoint[] => {
	const direct = list
		.map(parseTrendPoint)
		.filter((item): item is DeviceTrendPoint => item !== null);
	if (direct.length) return direct;
	const nested: DeviceTrendPoint[] = [];
	for (const item of list) {
		if (!item || typeof item !== "object") continue;
		const record = item as Record<string, unknown>;
		const child =
			record.points ?? record.data ?? record.values ?? record.list;
		if (Array.isArray(child)) {
			nested.push(...parseTrendPointList(child));
		}
	}
	return nested;
};

/**
 * 解析趋势接口 data（兼容点数组、分段、平行 timestamps/values）。
 *
 * @param {unknown} - `/iiot/tablet/device/{id}/trend` 解包后的 data。
 * @returns {DeviceTrendPoint[]} - 按时间升序的点。
 */
export const parseDeviceTrend = (data: unknown): DeviceTrendPoint[] => {
	if (data == null) return [];
	if (Array.isArray(data)) {
		return parseTrendPointList(data).sort((a, b) => a.time - b.time);
	}
	if (typeof data !== "object") return [];
	const record = data as Record<string, unknown>;
	const times = record.timestamps ?? record.times ?? record.time;
	const values = record.values ?? record.value;
	if (Array.isArray(times) && Array.isArray(values)) {
		const points: DeviceTrendPoint[] = [];
		const size = Math.min(times.length, values.length);
		for (let index = 0; index < size; index += 1) {
			const point = parseTrendPoint([times[index], values[index]]);
			if (point) points.push(point);
		}
		return points.sort((a, b) => a.time - b.time);
	}
	const nested =
		record.segments ??
		record.rooms ??
		record.list ??
		record.points ??
		record.data ??
		record.series;
	if (Array.isArray(nested)) {
		return parseTrendPointList(nested).sort((a, b) => a.time - b.time);
	}

	const fromValues: DeviceTrendPoint[] = [];
	for (const value of Object.values(record)) {
		if (!Array.isArray(value)) continue;
		fromValues.push(...parseTrendPointList(value));
	}
	return fromValues.sort((a, b) => a.time - b.time);
};

/**
 * 按上限均匀抽稀趋势点。
 *
 * @param {DeviceTrendPoint[]} - 原始点。
 * @param {number} - 最大点数。
 * @returns {DeviceTrendPoint[]} - 抽稀后的点。
 */
const downsampleTrendPoints = (
	points: DeviceTrendPoint[],
	maxPoints = TREND_MAX_POINTS,
): DeviceTrendPoint[] => {
	if (points.length <= maxPoints) return points;
	const step = (points.length - 1) / (maxPoints - 1);
	const next: DeviceTrendPoint[] = [];
	for (let index = 0; index < maxPoints; index += 1) {
		next.push(points[Math.round(index * step)]);
	}
	return next;
};

/**
 * 折线高对比色板（设备分段 / 房间设备共用）。
 */
export const ROOM_TREND_COLORS = [
	"#EE8C45",
	"#35B88F",
	"#5B7FE8",
	"#E05263",
	"#8B5FD3",
	"#D6A11D",
	"#23A7C9",
	"#CF67A5",
	"#6C9B3B",
	"#D66B2C",
	"#3976B8",
	"#8C704A",
];

/**
 * 按序号获取不循环复用的高对比折线颜色。
 *
 * @param {number} - 当前图表中的唯一房间 / 设备序号。
 * @returns {string} - CSS 颜色；超出预设色板后按黄金角生成。
 */
export const getTrendColor = (index: number): string => {
	const preset = ROOM_TREND_COLORS[index];
	if (preset) return preset;
	const hue = Math.round((index * 137.508 + 17) % 360);
	return `hsl(${hue} 68% 46%)`;
};

/**
 * 从分段对象取出图例名称（优先房间）。
 *
 * @param {Record<string, unknown>} - `segments[]` 单项。
 * @param {number} - 分段序号，名称缺失时作兜底。
 * @returns {string} - 图例文案。
 */
const toSegmentSeriesName = (
	item: Record<string, unknown>,
	index: number,
): string => {
	const room = String(item.room ?? item.roomName ?? "").trim();
	if (room) {
		return room.startsWith("房间") ? room : `房间${room}`;
	}
	const deviceName = String(item.deviceName ?? item.deviceCode ?? "").trim();
	if (deviceName) return deviceName;
	const pipelineId = String(item.pipelineId ?? "").trim();
	if (pipelineId) return pipelineId;
	return `分段${index + 1}`;
};

/**
 * 将设备趋势接口 data.segments[].points 转为多条折线。
 *
 * @param {unknown} - `/iiot/tablet/device/{id}/trend` 解包后的 data。
 * @returns {DeviceTrendSeriesItem[]} - 保留接口原始分段边界的序列。
 */
export const parseDeviceTrendSeries = (
	data: unknown,
): DeviceTrendSeriesItem[] => {
	if (!data || typeof data !== "object") return [];
	const record = data as Record<string, unknown>;
	if (!Array.isArray(record.segments)) return [];

	const series: DeviceTrendSeriesItem[] = [];
	const colorByName = new Map<string, string>();
	for (const [index, row] of record.segments.entries()) {
		const item =
			row && typeof row === "object"
				? (row as Record<string, unknown>)
				: {};
		const name = toSegmentSeriesName(item, index);
		let color = colorByName.get(name);
		if (!color) {
			color = getTrendColor(colorByName.size);
			colorByName.set(name, color);
		}
		const rawPoints = Array.isArray(item.points) ? item.points : [];
		const points = parseTrendPointList(rawPoints).sort(
			(a, b) => a.time - b.time,
		);
		series.push({
			name,
			color,
			data: points,
		});
	}
	return series;
};

/**
 * 将趋势接口 data 转为按设备折线图数据（按房间分段、分色）。
 *
 * @param {unknown} - 趋势接口 data。
 * @param {{ from: number; to: number } | undefined} - 本次查询区间。
 * @returns {DeviceTrendChartData} - 多条折线。
 */
export const toTrendChartData = (
	data: unknown,
	range?: { from: number; to: number },
): DeviceTrendChartData => {
	const series = parseDeviceTrendSeries(data)
		.map((item) => ({
			...item,
			data: range
				? item.data.filter(
						(point) =>
							point.time >= range.from && point.time <= range.to,
					)
				: item.data,
		}))
		.filter((item) => item.data.length > 0);
	if (!series.length) return EMPTY_TREND_CHART;
	return { series };
};

/**
 * 将后拉取的设备趋势合并进已有序列（按名称对齐，按时间去重升序）。
 *
 * @param {DeviceTrendChartData} - 当前已展示的数据。
 * @param {DeviceTrendChartData} - 新拉取的数据。
 * @returns {DeviceTrendChartData} - 合并后的数据。
 */
export const mergeTrendChartData = (
	current: DeviceTrendChartData,
	incoming: DeviceTrendChartData,
): DeviceTrendChartData => {
	if (!incoming.series.length) return current;
	if (!current.series.length) return incoming;
	const incomingByName = new Map(
		incoming.series.map((item) => [item.name, item]),
	);
	const used = new Set<string>();
	const merged = current.series.map((item) => {
		const next = incomingByName.get(item.name);
		if (!next) return item;
		used.add(item.name);
		if (!next.data.length) return item;
		const points = new Map(item.data.map((point) => [point.time, point]));
		for (const point of next.data) {
			points.set(point.time, point);
		}
		return {
			...item,
			data: [...points.values()].sort((a, b) => a.time - b.time),
		};
	});
	for (const item of incoming.series) {
		if (!used.has(item.name)) merged.push(item);
	}
	return { series: merged };
};

/**
 * 按房间设备生成空折线（接口失败或尚无点时占位图例）。
 *
 * @param {DeviceItem[]} - 房间内设备。
 * @returns {RoomTrendSeriesItem[]} - 空序列。
 */
export const buildEmptyRoomTrendSeries = (
	devices: DeviceItem[],
): RoomTrendSeriesItem[] => {
	return devices.map((item, index) => ({
		name: item.name.trim() || item.code || `设备${item.deviceId}`,
		color: getTrendColor(index),
		data: [],
	}));
};

/**
 * 将房间趋势接口 data 转为多 Y 轴折线序列。
 *
 * @param {unknown} - `/iiot/tablet/device/room/trend` 解包后的 data。
 * @param {{ from: number; to: number } | undefined} - 本次查询区间。
 * @returns {RoomTrendSeriesItem[]} - 按设备分系列，点来自 `series[].points`。
 */
export const toRoomTrendSeries = (
	data: unknown,
	range?: { from: number; to: number },
): RoomTrendSeriesItem[] => {
	if (!data || typeof data !== "object") return [];
	const record = data as Record<string, unknown>;
	if (!Array.isArray(record.series)) return [];

	const colorByName = new Map<string, string>();
	return record.series.map((row, index) => {
		const item =
			row && typeof row === "object"
				? (row as Record<string, unknown>)
				: {};
		const name =
			String(item.deviceName ?? "").trim() ||
			String(item.deviceCode ?? "").trim() ||
			`设备${index + 1}`;
		let color = colorByName.get(name);
		if (!color) {
			color = getTrendColor(colorByName.size);
			colorByName.set(name, color);
		}
		const parsedPoints = parseDeviceTrend(item);
		const points = downsampleTrendPoints(
			range
				? parsedPoints.filter(
						(point) =>
							point.time >= range.from && point.time <= range.to,
					)
				: parsedPoints,
		);
		return {
			name,
			color,
			data: points.map((point) => ({
				time: point.time,
				value: point.value,
			})),
		};
	});
};

/**
 * 将后拉取的房间趋势合并进已有序列（按名称对齐，按时间去重升序）。
 *
 * @param {RoomTrendSeriesItem[]} - 当前已展示的序列。
 * @param {RoomTrendSeriesItem[]} - 新拉取的序列。
 * @returns {RoomTrendSeriesItem[]} - 合并后的序列。
 */
export const mergeRoomTrendSeries = (
	current: RoomTrendSeriesItem[],
	incoming: RoomTrendSeriesItem[],
): RoomTrendSeriesItem[] => {
	if (!incoming.length) return current;
	if (!current.length) return incoming;
	const incomingByName = new Map(incoming.map((item) => [item.name, item]));
	const used = new Set<string>();
	const merged = current.map((item) => {
		const next = incomingByName.get(item.name);
		if (!next) return item;
		used.add(item.name);
		if (!next.data.length) return item;
		const points = new Map(item.data.map((point) => [point.time, point]));
		for (const point of next.data) {
			points.set(point.time, point);
		}
		return {
			...item,
			data: [...points.values()].sort((a, b) => a.time - b.time),
		};
	});
	for (const item of incoming) {
		if (!used.has(item.name)) merged.push(item);
	}
	return merged;
};

/**
 * 按房间汇总 WS 实时点位卡（按 propertyId 去重，保留首次出现顺序）。
 *
 * @param {DeviceItem[]} - 房间内设备。
 * @returns {DeviceMetric[]} - 实时点位列表。
 */
export const collectRoomMetrics = (devices: DeviceItem[]): DeviceMetric[] => {
	const seen = new Set<string>();
	const metrics: DeviceMetric[] = [];
	for (const device of devices) {
		for (const metric of device.metrics) {
			if (!metric.propertyId || seen.has(metric.propertyId)) continue;
			seen.add(metric.propertyId);
			metrics.push(metric);
		}
	}
	return metrics;
};
