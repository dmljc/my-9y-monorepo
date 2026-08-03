import { request } from "@/utils";
import type { AlarmRule, RoomListQuery, RuleListQuery } from "./interface";

export const list = (data: RuleListQuery): Promise<any> => {
	return request.get("/iiot/alarm/rule/list", { params: data });
};

export const listLevels = (): Promise<any> => {
	return request.get("/iiot/alarm/level/list", {
		params: { pageNum: 1, pageSize: 100 },
	});
};

export const buildings = (): Promise<any> => {
	return request.get("/iiot/alarm/buildings");
};

export const rooms = (data: RoomListQuery): Promise<any> => {
	return request.get("/iiot/alarm/rooms", { params: data });
};

/** 按厂房查询设备台账列表（buildingId 必填）。 */
export const listDevices = (buildingId: string): Promise<any> => {
	return request.get("/iiot/tablet/ledger/list", {
		params: { buildingId },
	});
};

/** 查询物实例列表。 */
export const getThings = (): Promise<any> => {
	return request.get("/iiot/device-control/things");
};

/** 按物实例查询可控点位（thingId 常带前导 `/`；Tomcat 禁 `//` 与 `%2F`，路径段须去掉前导斜杠）。 */
export const getControllable = (thingId: string): Promise<any> => {
	const id = thingId.trim().replace(/^\/+/, "");
	return request.get(
		`/iiot/device-control/controllable/${encodeURIComponent(id)}`,
	);
};

export const create = (data: AlarmRule): Promise<any> => {
	return request.post("/iiot/alarm/rule", data);
};

export const update = (data: AlarmRule): Promise<any> => {
	return request.put("/iiot/alarm/rule", data);
};

export const remove = (id: string): Promise<any> => {
	return request.delete(`/iiot/alarm/rule/${id}`);
};
