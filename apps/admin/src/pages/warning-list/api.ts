import { request } from "@/utils";
import type { AlarmListQuery } from "./interface";

export const list = (data: AlarmListQuery): Promise<any> => {
	return request.get("/iiot/alarm/list", { params: data });
};

export const getStats = (): Promise<any> => {
	return request.get("/iiot/alarm/stats");
};

export const resolve = (id: string): Promise<any> => {
	return request.put(`/iiot/alarm/${id}/resolve`);
};
