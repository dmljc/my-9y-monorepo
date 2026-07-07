import { request } from "@/utils";
import type { AlarmRule, RuleListQuery } from "./interface";

export const list = (data: RuleListQuery): Promise<any> => {
	return request.get("/iiot/alarm/rule/list", { params: data });
};

export const listLevels = (): Promise<any> => {
	return request.get("/iiot/alarm/level/list", {
		params: { pageNum: 1, pageSize: 100 },
	});
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
