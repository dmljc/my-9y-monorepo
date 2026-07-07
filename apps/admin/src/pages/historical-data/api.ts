import { request } from "@/utils";
import type { DeviceDataListQuery } from "./interface";

function parseContextData(data: unknown): any {
	if (Array.isArray(data)) return { list: data, total: data.length };
	if (!data || typeof data !== "object") return { list: [], total: 0 };
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.rows)) {
		return { list: record.rows, total: record.rows.length };
	}
	if (Array.isArray(record.list)) {
		return { list: record.list, total: record.list.length };
	}
	return data;
}

export const list = (data: DeviceDataListQuery): Promise<any> => {
	if (data.thingId && data.alarmTime) {
		return request
			.get("/iiot/alarm/context-data", {
				params: {
					thingId: data.thingId,
					alarmTime: data.alarmTime,
				},
			})
			.then(parseContextData);
	}
	return request.get("/iiot/device-data/list", { params: data });
};
