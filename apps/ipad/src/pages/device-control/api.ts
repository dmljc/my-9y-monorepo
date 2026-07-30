import { request } from "@/utils";

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
 * 设备清洗启停（服务端自动切换状态）。
 *
 * @param {number} - 设备 ID。
 */
export const toggleClean = (deviceId: number): Promise<any> => {
	return request.post(`/iiot/tablet/device/${deviceId}/clean`);
};
