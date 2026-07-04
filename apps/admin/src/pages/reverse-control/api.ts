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

export const getModels = (): Promise<any> => {
	return request.get("/iiot/device-control/models");
};

export const getControllable = (modelId: string): Promise<any> => {
	return request.get(`/iiot/device-control/controllable/${modelId}`);
};
