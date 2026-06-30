// import { request } from "@/services/request";

/** API 接口配置数据类型 */
export interface ApiConfig {
	id: string;
	name: string;
	type: string;
	url: string;
	status: string;
	lastSyncTime: string;
}

interface ApiConfigListResult {
	list: ApiConfig[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/** 获取接口配置列表（分页） */
export function list(params: {
	pageNum: number;
	pageSize: number;
}): Promise<ApiConfigListResult> {
	// return request.get("/api/system/configs", { params });
	return Promise.resolve({
		list: [],
		total: 0,
		pageNum: params.pageNum,
		pageSize: params.pageSize,
	});
}

/** 新增接口配置 */
export function create(data: object): Promise<ApiConfig> {
	// return request.post("/api/system/configs", data);
	const input = data as Record<string, unknown>;
	return Promise.resolve({
		id: String(Date.now()),
		name: (input.name as string) ?? "",
		type: (input.type as string) ?? "",
		url: (input.url as string) ?? "",
		status: "active",
		lastSyncTime: new Date().toISOString(),
	});
}

/** 编辑接口配置 */
export function update(id: string, data: object): Promise<ApiConfig> {
	// return request.put(`/api/system/configs/${id}`, data);
	const input = data as Record<string, unknown>;
	return Promise.resolve({
		id,
		name: (input.name as string) ?? "",
		type: (input.type as string) ?? "",
		url: (input.url as string) ?? "",
		status: "active",
		lastSyncTime: new Date().toISOString(),
	});
}

/** 删除接口配置 */
export function remove(_id: string): Promise<boolean> {
	// return request.delete(`/api/system/configs/${id}`);
	return Promise.resolve(true);
}
