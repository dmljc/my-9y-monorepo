import dayjs from "dayjs";
import type { DeviceFormValues, DeviceStats, InspectionDevice } from "./types";
import {
	calcDeviceStats,
	calcNextInspectionDate,
	DATE_FORMAT,
	enrichDevice,
	filterDevices,
	formValuesToDevice,
	MOCK_DEVICES,
} from "./utils";

/** 列表查询参数 */
export interface DeviceListParams {
	pageNum: number;
	pageSize: number;
	deviceName?: string;
	factoryBuilding?: string;
}

/** 列表返回结果 */
export interface DeviceListResult {
	list: InspectionDevice[];
	total: number;
	pageNum: number;
	pageSize: number;
	stats: DeviceStats;
}

// mock 内存存储，接入真实 API 后整段替换为 request 调用
const devicesStore: InspectionDevice[] = MOCK_DEVICES.map(enrichDevice);

/** 按当前日期刷新所有设备的点检状态 */
function refreshStatuses(): void {
	for (const device of devicesStore) {
		device.status = enrichDevice(device).status;
	}
}

function findDeviceIndex(id: string): number {
	return devicesStore.findIndex((item) => item.id === id);
}

/** 获取点检设备列表（分页） */
export function list(params: DeviceListParams): Promise<DeviceListResult> {
	// return request.get("/api/inspection-ledger", { params });
	refreshStatuses();
	const { pageNum, pageSize, deviceName = "", factoryBuilding = "" } = params;
	const filtered = filterDevices(devicesStore, deviceName, factoryBuilding);
	const start = (pageNum - 1) * pageSize;

	return Promise.resolve({
		list: filtered.slice(start, start + pageSize),
		total: filtered.length,
		pageNum,
		pageSize,
		stats: calcDeviceStats(devicesStore),
	});
}

/** 创建设备 */
export function create(values: DeviceFormValues): Promise<InspectionDevice> {
	// return request.post("/api/inspection-ledger", values);
	const record = enrichDevice({
		id: `dev-${Date.now()}`,
		...formValuesToDevice(values),
	});
	devicesStore.unshift(record);
	return Promise.resolve(record);
}

/** 更新设备 */
export function update(
	id: string,
	values: DeviceFormValues,
): Promise<InspectionDevice> {
	// return request.put(`/api/inspection-ledger/${id}`, values);
	const index = findDeviceIndex(id);
	if (index === -1) {
		return Promise.reject(new Error("设备不存在"));
	}

	const record = enrichDevice({ id, ...formValuesToDevice(values) });
	devicesStore[index] = record;
	return Promise.resolve(record);
}

/** 删除设备 */
export function remove(id: string): Promise<void> {
	// return request.delete(`/api/inspection-ledger/${id}`);
	const index = findDeviceIndex(id);
	if (index === -1) {
		return Promise.reject(new Error("设备不存在"));
	}
	devicesStore.splice(index, 1);
	return Promise.resolve();
}

/** 执行点检：上次点检设为今日，并重算下次点检日期 */
export function performInspection(id: string): Promise<InspectionDevice> {
	// return request.post(`/api/inspection-ledger/${id}/inspect`);
	const index = findDeviceIndex(id);
	if (index === -1) {
		return Promise.reject(new Error("设备不存在"));
	}

	const current = devicesStore[index];
	const today = dayjs().format(DATE_FORMAT);
	const record = enrichDevice({
		...current,
		lastInspectionDate: today,
		nextInspectionDate: calcNextInspectionDate(
			today,
			current.cycleValue,
			current.cycleUnit,
		),
	});
	devicesStore[index] = record;
	return Promise.resolve(record);
}

/** 获取全部设备（供表单唯一性校验） */
export function getAllDevices(): InspectionDevice[] {
	refreshStatuses();
	return [...devicesStore];
}
