import { request } from "@/utils";
import type {
	DevicePipelineSaveParams,
	RoomPipelinePayload,
} from "./interface";

/**
 * 查询厂房列表。
 */
export const listBuildings = (): Promise<any> => {
	return request.get("/iiot/alarm/buildings");
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
 * 设备-查询管道配置列表。
 *
 * @param {number} - 厂房 ID。
 */
export const listDevicePipelines = (buildingId: number): Promise<any> => {
	return request.get("/iiot/tablet/pipeline/device/list", {
		params: { buildingId },
	});
};

/**
 * 设备-保存管道配置（query 参数）。
 *
 * @param {DevicePipelineSaveParams} - deviceId / pipelineId / flowRate。
 */
export const saveDevicePipeline = (
	params: DevicePipelineSaveParams,
): Promise<any> => {
	return request.post("/iiot/tablet/pipeline/device/save", null, { params });
};

/**
 * 房间-查询管道配置列表（按厂房；可不传 roomId 拉全量）。
 *
 * @param {number} - 厂房 ID。
 * @param {number} - 房间 ID（可选）。
 */
export const listRoomPipelines = (
	buildingId: number,
	roomId?: number,
): Promise<any> => {
	return request.get("/iiot/tablet/pipeline/list", {
		params: {
			buildingId,
			...(roomId !== undefined ? { roomId } : {}),
		},
	});
};

/**
 * 管道号下拉数据源（兼房间↔管道映射）。
 *
 * @param {number} - 厂房 ID。
 */
export const listPipelineOptions = (buildingId: number): Promise<any> => {
	return request.get("/iiot/tablet/pipeline/options", {
		params: { buildingId },
	});
};

/**
 * 房间-保存管道配置（含校验）。
 *
 * @param {RoomPipelinePayload} - 提交体。
 */
export const saveRoomPipeline = (data: RoomPipelinePayload): Promise<any> => {
	return request.post("/iiot/tablet/pipeline/save", data);
};
