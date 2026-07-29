import { sortBuildingTabs } from "@/utils/buildingTabs";
import type {
	BuildingTab,
	Device,
	DeviceFormValues,
	DeviceStatus,
	TabletDevicePayload,
	TabletDeviceRow,
	ThingOption,
} from "./interface";

/** 设备编码最大长度（后端约束）。 */
export const MAX_LENGTH_20 = 20;

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
export const toDeviceStatus = (deviceStatus?: string): DeviceStatus => {
	return deviceStatus === "1" ? "closed" : "running";
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
	return {
		id: Number(row.id),
		deviceCode: row.deviceCode ?? "",
		deviceName: row.deviceName ?? "",
		manufacturer: row.manufacturer ?? "",
		thingId: row.thingId ?? "",
		sampleRoom: formatSampleRoom(row.room),
		status: toDeviceStatus(row.deviceStatus),
		buildingId: Number(row.buildingId ?? 0),
		deviceType: row.deviceType,
		deviceStatus: row.deviceStatus ?? "0",
	};
};

/**
 * 将物实例列表转为下拉选项。
 *
 * @param {unknown} - `/iiot/device-control/things` 解包后的 data。
 * @returns {ThingOption[]} - 下拉选项。
 */
export const toThingOptions = (data: unknown): ThingOption[] => {
	if (!data || typeof data !== "object") return [];
	const things = (data as { things?: unknown }).things;
	if (!Array.isArray(things)) return [];

	const options: ThingOption[] = [];
	for (const item of things) {
		if (!item || typeof item !== "object") continue;
		const row = item as Record<string, unknown>;
		const thingId = String(row.thing_id ?? "").trim();
		if (!thingId) continue;
		const thingName = String(row.thing_name ?? "").trim();
		const modelName = String(row.model_name ?? "").trim();
		let label = thingId;
		if (thingName && thingName !== thingId) {
			label = `${thingName}（${thingId}）`;
		} else if (modelName) {
			label = `${modelName}（${thingId}）`;
		}
		options.push({ value: thingId, label });
	}
	return options;
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
 * 组装新增请求体。
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
		thingId: values.thingId.trim(),
		buildingId: building.buildingId,
		building: building.building,
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
	const thingId = values.thingId.trim();
	return {
		id: record.id,
		deviceCode: values.deviceCode.trim(),
		deviceName: values.deviceName.trim(),
		...(manufacturer ? { manufacturer } : {}),
		...(thingId ? { thingId } : {}),
		buildingId: record.buildingId || building?.buildingId || 0,
		building: building?.building,
		deviceStatus: record.deviceStatus,
		deviceType: record.deviceType,
	};
};
