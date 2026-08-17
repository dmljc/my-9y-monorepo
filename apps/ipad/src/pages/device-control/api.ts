import { request } from "@/utils";
import type {
	DeviceTrendQuery,
	DeviceUpdatePayload,
	RoomConfigPayload,
	RoomTrendQuery,
	ThingsListQuery,
} from "./interface";

/**
 * 查询厂房列表。
 */
export const listBuildings = (): Promise<any> => {
	return request.get("/iiot/alarm/buildings");
};

/**
 * 按厂房查询房间 + 设备列表。
 *
 * @param {number} - 厂房 ID。
 */
export const listRooms = (buildingId: number): Promise<any> => {
	return request.get("/iiot/tablet/device/rooms", {
		params: { buildingId },
	});
};

/**
 * 厂房总开关（on / off）。
 *
 * @param {number} - 厂房 ID。
 * @param {"on" | "off"} - 开关动作。
 */
export const switchBuilding = (
	buildingId: number,
	action: "on" | "off",
): Promise<any> => {
	return request.put(`/iiot/tablet/device/building/${buildingId}/switch`, {
		action,
	});
};

/**
 * 设备开关（on / off）。
 *
 * @param {number} - 设备 ID。
 * @param {"on" | "off"} - 开关动作。
 */
export const switchDevice = (
	deviceId: number,
	action: "on" | "off",
): Promise<any> => {
	return request.put(`/iiot/tablet/device/${deviceId}/switch`, {
		action,
	});
};

/**
 * 查询设备点位历史趋势（按房间分段）。
 *
 * @param {DeviceTrendQuery} - 设备、点位与时间范围；deviceId 仅作路径参数。
 */
export const listDeviceTrend = ({
	deviceId,
	...params
}: DeviceTrendQuery): Promise<any> => {
	return request.get(`/iiot/tablet/device/${deviceId}/trend`, { params });
};

/**
 * 查询房间点位历史趋势（按设备分系列）。
 *
 * @param {RoomTrendQuery} - 厂房、房间、点位与时间范围。
 */
export const listRoomTrend = (params: RoomTrendQuery): Promise<any> => {
	return request.get("/iiot/tablet/device/room/trend", { params });
};

/**
 * 设备清洗启停。
 *
 * @param {number} - 设备 ID。
 * @param {boolean} - true 开始清洗，false 取消清洗。
 */
export const toggleClean = (
	deviceId: number,
	cleanStatus: boolean,
): Promise<any> => {
	return request.post(`/iiot/tablet/device/${deviceId}/clean`, cleanStatus, {
		headers: { "Content-Type": "application/json" },
		transformRequest: [(data) => JSON.stringify(data)],
	});
};

/**
 * 按厂房查询房间下拉（报警房间字典）。
 *
 * @param {number} - 厂房 ID。
 */
export const listAlarmRooms = (buildingId: number): Promise<any> => {
	return request.get("/iiot/alarm/rooms", {
		params: { buildingId },
	});
};

/**
 * 查询物实例列表（支持 keyword 模糊搜索）。
 *
 * @param {ThingsListQuery} - 关键字、分页 limit / offset。
 */
export const listThings = (data: ThingsListQuery): Promise<any> => {
	return request.get("/iiot/device-control/things", { params: data });
};

/**
 * 获取设备详情（含厂家、thingId 列表）。
 *
 * @param {number} - 设备 id（台账 / rooms `deviceId`）。
 */
export const detail = (id: number): Promise<any> => {
	return request.get(`/iiot/tablet/ledger/${id}`);
};

/**
 * 房间配置详情（弹窗回显）。
 *
 * @param {number} - 设备 ID（rooms `deviceId`）。
 */
export const roomDetail = (deviceId: number): Promise<any> => {
	return request.get(`/iiot/tablet/pipeline/device/${deviceId}`);
};

/**
 * 保存房间配置（房间 + 流量）。
 *
 * @param {RoomConfigPayload} - deviceId / 房间 / 流量。
 */
export const saveRoomConfig = (data: RoomConfigPayload): Promise<any> => {
	return request.post("/iiot/tablet/pipeline/device/save", data);
};

/**
 * 编辑设备（实例配置确定，对齐添加设备编辑）。
 *
 * @param {DeviceUpdatePayload} - 含 id、thingIds 的提交体。
 */
export const update = (data: DeviceUpdatePayload): Promise<any> => {
	return request.put("/iiot/tablet/ledger", data);
};
