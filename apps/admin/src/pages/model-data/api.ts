// import { request } from "@/services/request";

/** 物模型数据记录 */
export interface ModelDataRecord {
	id: string;
	deviceName: string;
	modelName: string;
	pointName: string;
	pointId: string;
	type: string;
	value: string | number;
	time: string;
}

/** 列表查询参数 */
export interface ModelDataListParams {
	pageNum: number;
	pageSize: number;
	deviceName?: string;
}

/** 列表返回结果 */
interface ModelDataListResult {
	list: ModelDataRecord[];
	total: number;
	pageNum: number;
	pageSize: number;
}

const MOCK_RECORDS: ModelDataRecord[] = [
	{
		id: "model-001",
		deviceName: "取样泵-A101",
		modelName: "取样泵",
		pointName: "这也是一个名称",
		pointId: "/114_FV201_KDFK",
		type: "BOOL",
		value: 1,
		time: "2025-11-23 15:14:13",
	},
	{
		id: "model-002",
		deviceName: "取样泵-A101",
		modelName: "取样泵",
		pointName: "这也是一个名称",
		pointId: "/114_FV201_KDFK",
		type: "INT",
		value: 666,
		time: "",
	},
	{
		id: "model-003",
		deviceName: "反应釜-A114",
		modelName: "反应釜",
		pointName: "温度点位",
		pointId: "/114_FV201_TEMP",
		type: "FLOAT",
		value: 36.5,
		time: "2025-11-23 16:02:41",
	},
	{
		id: "model-004",
		deviceName: "A区-201",
		modelName: "房间监测",
		pointName: "氨气浓度",
		pointId: "/201_NH3",
		type: "FLOAT",
		value: 12.8,
		time: "2025-11-24 09:15:00",
	},
];

const recordsStore: ModelDataRecord[] = [...MOCK_RECORDS];

function filterRecords(params: ModelDataListParams): ModelDataRecord[] {
	const keyword = params.deviceName?.trim().toLowerCase();
	if (!keyword) return recordsStore;

	return recordsStore.filter(
		(item) =>
			item.deviceName.toLowerCase().includes(keyword) ||
			item.modelName.toLowerCase().includes(keyword),
	);
}

/** 获取物模型数据列表（分页） */
export function list(
	params: ModelDataListParams,
): Promise<ModelDataListResult> {
	// return request.get("/api/model-data/list", { params });
	const filtered = filterRecords(params);
	const { pageNum, pageSize } = params;
	const start = (pageNum - 1) * pageSize;

	return Promise.resolve({
		list: filtered.slice(start, start + pageSize),
		total: filtered.length,
		pageNum,
		pageSize,
	});
}

/** 删除物模型数据记录 */
export function remove(id: string): Promise<void> {
	// return request.delete(`/api/model-data/${id}`);
	const index = recordsStore.findIndex((item) => item.id === id);
	if (index === -1) {
		return Promise.reject(new Error("记录不存在"));
	}
	recordsStore.splice(index, 1);
	return Promise.resolve();
}

/** 同步物模型数据 */
export function sync(): Promise<void> {
	// return request.post("/api/model-data/sync");
	return Promise.resolve();
}
