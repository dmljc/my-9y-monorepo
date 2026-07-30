import { request } from "@/utils";
import type { WarningHistoryListQuery } from "./interface";

export const list = (data: WarningHistoryListQuery): Promise<any> => {
	return request.get("/iiot/alarm/context-data", { params: data });
};
