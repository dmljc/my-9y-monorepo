import { request } from "@/utils";
import type { StatisticsQuery } from "./interface";

export const alarmByBuilding = (data: StatisticsQuery): Promise<any> => {
	return request.get("/iiot/statistics/alarm-by-building", { params: data });
};

export const alarmByLevel = (data: StatisticsQuery): Promise<any> => {
	return request.get("/iiot/statistics/alarm-by-level", { params: data });
};

export const alarmTrend = (days: number): Promise<any> => {
	return request.get("/iiot/statistics/alarm-trend", { params: { days } });
};
