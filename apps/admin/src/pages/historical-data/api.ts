import { request } from "@/utils";
import type { DeviceDataListQuery } from "./interface";

export const list = (data: DeviceDataListQuery): Promise<any> => {
	return request.get("/iiot/device-data/list", { params: data });
};
