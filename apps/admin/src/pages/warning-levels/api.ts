import { request } from "@/utils";
import type { IiotAlarmLevel, LevelListQuery } from "./interface";

export const list = (data: LevelListQuery): Promise<any> => {
	return request.get("/iiot/alarm/level/list", { params: data });
};

export const create = (data: IiotAlarmLevel): Promise<any> => {
	return request.post("/iiot/alarm/level", data);
};

export const update = (data: IiotAlarmLevel): Promise<any> => {
	return request.put("/iiot/alarm/level", data);
};

export const remove = (id: string): Promise<any> => {
	return request.delete(`/iiot/alarm/level/${id}`);
};
