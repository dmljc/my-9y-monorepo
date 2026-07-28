import { request } from "@/utils";
import type { TabletDevicePayload } from "./interface";

/**
 * 查询厂房列表。
 */
export const listBuildings = (): Promise<any> => {
	return request.get("/iiot/alarm/buildings");
};

/**
 * 按厂房查询设备列表（buildingId 必填）。
 *
 * @param {number} - 厂房 ID。
 */
export const list = (buildingId: number): Promise<any> => {
	return request.get("/iiot/tablet/ledger/list", {
		params: { buildingId },
	});
};

/**
 * 根据设备编码查询台账（新增时自动填充）。
 *
 * @param {string} - 设备编码。
 */
export const lookup = (deviceCode: string): Promise<any> => {
	return request.get("/iiot/tablet/ledger/lookup", {
		params: { deviceCode },
	});
};

/**
 * 获取设备详情（编辑回显物实例等精简列表未返回字段）。
 *
 * @param {number} - 设备 id。
 */
export const detail = (id: number): Promise<any> => {
	return request.get(`/iiot/tablet/ledger/${id}`);
};

/**
 * 查询物实例候选（从设备数据列表去重 thingId）。
 */
export const listThings = (): Promise<any> => {
	return request.get("/iiot/device-data/list", {
		params: { pageNum: 1, pageSize: 1000 },
	});
};

/**
 * 新增设备。
 *
 * @param {TabletDevicePayload} - 提交体。
 */
export const create = (data: TabletDevicePayload): Promise<any> => {
	return request.post("/iiot/tablet/ledger", data);
};

/**
 * 编辑设备（仅已关闭可编辑）。
 *
 * @param {TabletDevicePayload} - 含 id 的提交体。
 */
export const update = (data: TabletDevicePayload): Promise<any> => {
	return request.put("/iiot/tablet/ledger", data);
};

/**
 * 删除设备（仅已关闭可删除）。
 *
 * @param {string} - 设备 id，多个用逗号分隔。
 */
export const remove = (ids: string): Promise<any> => {
	return request.delete(`/iiot/tablet/ledger/${ids}`);
};

/**
 * 切换设备运行状态（运行中 / 已关闭）。
 *
 * @param {number} - 设备 id。
 */
export const toggleStatus = (id: number): Promise<any> => {
	return request.put(`/iiot/tablet/ledger/${id}/status`);
};

/**
 * 厂房总开关（on / off），会联动该厂房设备状态。
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
