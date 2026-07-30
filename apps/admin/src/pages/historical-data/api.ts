import { request } from "@/utils";
import type { HistoricalDataListQuery } from "./interface";

export const list = (data: HistoricalDataListQuery): Promise<any> => {
	return request.get("/iiot/device-data/history", { params: data });
};
