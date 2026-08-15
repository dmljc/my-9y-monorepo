import { sortBuildingTabs } from "@/utils/buildingTabs";
import type {
	BuildingTab,
	Device,
	DeviceFormValues,
	DeviceStatus,
	TabletDevicePayload,
	TabletDeviceRow,
} from "./interface";

/** 设备编码最大长度（后端约束）。 */
export const MAX_LENGTH_100 = 100;

/** 设备名称、厂家最大长度（后端约束）。 */
export const MAX_LENGTH_12 = 12;

/** 列表默认每页条数。 */
export const DEFAULT_PAGE_SIZE = 10;

/** 列表每页条数可选项。 */
export const PAGE_SIZE_OPTIONS = ["10", "15", "20", "25", "50", "100"];

/**
 * 状态展示文案。
 */
export const STATUS_LABEL: Record<DeviceStatus, string> = {
	running: "运行中",
	closed: "已关闭",
};

/**
 * 将后端 deviceStatus 转为页面状态。
 *
 * @param {string | undefined} - 后端状态码。
 * @returns {DeviceStatus} - 页面状态。
 */
export const toDeviceStatus = (
	deviceStatus?: string | number,
): DeviceStatus => {
	return String(deviceStatus ?? "") === "1" ? "closed" : "running";
};

/**
 * 格式化取样房间展示。
 *
 * @param {string | undefined} - 后端 room。
 * @returns {string} - 展示文案。
 */
export const formatSampleRoom = (room?: string): string => {
	const value = room?.trim();
	if (!value || value === "-") return "—";
	return value;
};

/**
 * 将列表/详情行映射为表格行。
 *
 * @param {TabletDeviceRow} - 接口行。
 * @returns {Device} - 列表行。
 */
export const mapRowToDevice = (row: TabletDeviceRow): Device => {
	const thingIds = parseThingIds(row.thingIds ?? row.thingId);
	return {
		id: Number(row.id),
		deviceCode: row.deviceCode ?? "",
		deviceName: row.deviceName ?? "",
		manufacturer: row.manufacturer ?? "",
		thingId: joinThingIds(thingIds) || row.thingId || "",
		sampleRoom: formatSampleRoom(row.room),
		status: toDeviceStatus(row.deviceStatus),
		buildingId: Number(row.buildingId ?? 0),
		deviceType: row.deviceType,
		deviceStatus: row.deviceStatus ?? "0",
	};
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
 * 将多选物实例 ID 序列化为后端 thingId（逗号分隔，兼容旧字段）。
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
 * @returns {{ device: TabletDeviceRow; thingIds: string[] }} - 设备字段与物实例列表。
 */
export const parseDeviceDetail = (
	data: unknown,
): { device: TabletDeviceRow; thingIds: string[] } => {
	if (!data || typeof data !== "object") {
		return { device: {}, thingIds: [] };
	}
	const record = data as Record<string, unknown>;
	const nestedDevice =
		record.device && typeof record.device === "object"
			? (record.device as TabletDeviceRow)
			: null;
	const device = nestedDevice ?? (record as TabletDeviceRow);
	const thingIds = parseThingIds(
		record.thingIds ??
			record.thingId ??
			nestedDevice?.thingId ??
			(device as { thingIds?: unknown }).thingIds,
	);
	return { device, thingIds };
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
 * 解析列表接口 data.list。
 *
 * @param {unknown} - list 接口解包后的 data。
 * @returns {TabletDeviceRow[]} - 行数组。
 */
export const parseDeviceList = (data: unknown): TabletDeviceRow[] => {
	if (!data || typeof data !== "object") return [];
	const list = (data as { list?: unknown }).list;
	return Array.isArray(list) ? (list as TabletDeviceRow[]) : [];
};

/**
 * 根据设备列表推断厂房总开关状态：全部已关闭视为关，否则为开。
 *
 * @param {Device[]} - 当前厂房设备列表。
 * @returns {boolean} - 总开关是否开启。
 */
export const deriveMasterOn = (devices: Device[]): boolean => {
	if (!devices.length) return true;
	return devices.some((item) => item.status === "running");
};

/**
 * 组装新增请求体（deviceStatus 固定为 0）。
 *
 * @param {DeviceFormValues} - 表单值。
 * @param {BuildingTab} - 当前厂房。
 * @returns {TabletDevicePayload} - 提交体。
 */
export const buildCreatePayload = (
	values: DeviceFormValues,
	building: BuildingTab,
): TabletDevicePayload => {
	return {
		deviceCode: values.deviceCode.trim(),
		deviceName: values.deviceName.trim(),
		manufacturer: values.manufacturer.trim(),
		buildingId: building.buildingId,
		building: building.building,
		deviceStatus: "0",
	};
};

/**
 * 组装编辑请求体（仅已关闭设备可提交）。
 *
 * @param {DeviceFormValues} - 表单值。
 * @param {Device} - 当前编辑行。
 * @param {BuildingTab | null} - 当前厂房（补全 building 名称）。
 * @returns {TabletDevicePayload} - 提交体。
 */
export const buildUpdatePayload = (
	values: DeviceFormValues,
	record: Device,
	building: BuildingTab | null,
): TabletDevicePayload => {
	const manufacturer = values.manufacturer.trim();
	return {
		id: record.id,
		deviceCode: values.deviceCode.trim(),
		deviceName: values.deviceName.trim(),
		...(manufacturer ? { manufacturer } : {}),
		buildingId: record.buildingId || building?.buildingId || 0,
		building: building?.building,
		deviceStatus: record.deviceStatus,
		deviceType: record.deviceType,
	};
};
