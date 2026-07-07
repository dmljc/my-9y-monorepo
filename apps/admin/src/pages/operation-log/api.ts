import { request } from "@/utils";
import type { OperLogListQuery } from "./interface";

export const list = (data: OperLogListQuery): Promise<any> => {
	return request.get("/monitor/operlog/list", { params: data });
};

export const exportLog = (data: OperLogListQuery) => {
	return request.raw.post("/monitor/operlog/export", null, {
		params: data,
		responseType: "blob",
	});
};
