// import { request } from "@/services/request";

/** 设备分类数据类型 */
export interface DeviceCategory {
	key: string;
	title: string;
	children?: DeviceCategory[];
}

/** 设备数据记录类型 */
export interface DeviceRecord {
	id: string;
	pointName: string;
	address: string;
	deviceName: string;
	type: string;
	value: number;
	time: string;
}

/** 设备数据查询参数 */
export interface DeviceRecordListParams {
	pageNum: number;
	pageSize: number;
	categoryKey?: string;
	deviceName?: string;
}

/** 设备数据返回结果 */
interface DeviceRecordListResult {
	list: DeviceRecord[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/** 获取设备分类列表（用于级联选择器） */
export function listCategories(): Promise<DeviceCategory[]> {
	// return request.get("/api/device/categories");
	return Promise.resolve([]);
}

/** 获取设备数据列表（分页） */
export function list(
	params: DeviceRecordListParams,
): Promise<DeviceRecordListResult> {
	// return request.get("/api/device/records", { params });
	return Promise.resolve({
		list: [],
		total: 0,
		pageNum: params.pageNum,
		pageSize: params.pageSize,
	});
}

/** 删除设备数据记录 */
export function remove(_id: string): Promise<boolean> {
	// return request.delete(`/api/device/records/${id}`);
	return Promise.resolve(true);
}

/** 同步设备数据 */
export function sync(): Promise<boolean> {
	// return request.post("/api/device/records/sync");
	return Promise.resolve(true);
}
