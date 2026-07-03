import { request } from "@/utils";
import type { DeviceDataListQuery } from "./interface";

export const list = (data: DeviceDataListQuery): Promise<any> => {
	return request.get("/iiot/device-data/list", { params: data });
};

export const remove = (ids: string): Promise<any> => {
	return request.delete(`/iiot/device-data/local/${ids}`);
};

export const sync = (): Promise<any> => {
	return request.post("/iiot/device-data/sync");
};
