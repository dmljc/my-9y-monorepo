import { request } from "@/utils";
import type {
	DeviceTrendQuery,
	InstanceConfigPayload,
	RoomConfigPayload,
	RoomTrendQuery,
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
 * 设备清洗启停（服务端自动切换状态）。
 *
 * @param {number} - 设备 ID。
 */
export const toggleClean = (deviceId: number): Promise<any> => {
	return request.post(`/iiot/tablet/device/${deviceId}/clean`);
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
 * 查询物实例列表。
 */
export const listThings = (): Promise<any> => {
	return request.get("/iiot/device-control/things");
};

/**
 * 保存房间配置（房间 + 流量）。
 *
 * @param {number} - 设备 ID。
 * @param {RoomConfigPayload} - 房间与流量。
 */
export const saveRoomConfig = (
	deviceId: number,
	data: RoomConfigPayload,
): Promise<any> => {
	return request.put(`/iiot/tablet/device/${deviceId}/room`, data);
};

/**
 * 保存实例配置（物实例绑定）。
 *
 * @param {number} - 设备 ID。
 * @param {InstanceConfigPayload} - 物实例 ID 列表。
 */
export const saveInstanceConfig = (
	deviceId: number,
	data: InstanceConfigPayload,
): Promise<any> => {
	return request.put(`/iiot/tablet/device/${deviceId}/instance`, data);
};
