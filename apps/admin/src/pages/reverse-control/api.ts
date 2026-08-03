import { request } from "@/utils";
import type {
	ChangeStatusPayload,
	ControlRuleListQuery,
	IiotControlRule,
} from "./interface";

export const list = (data: ControlRuleListQuery): Promise<any> => {
	return request.get("/iiot/device-control/rule/list", { params: data });
};

export const create = (data: IiotControlRule): Promise<any> => {
	return request.post("/iiot/device-control/rule", data);
};

export const update = (data: IiotControlRule): Promise<any> => {
	return request.put("/iiot/device-control/rule", data);
};

export const remove = (ids: string): Promise<any> => {
	return request.delete(`/iiot/device-control/rule/${ids}`);
};

export const changeStatus = (data: ChangeStatusPayload): Promise<any> => {
	return request.put("/iiot/device-control/rule/changeStatus", data);
};

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
