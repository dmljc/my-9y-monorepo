// import { request } from "@/services/request";

/** 物模型数据记录 */
export interface ModelDataRecord {
	id: string;
	modelName: string;
	modelKey: string;
	assetType: "device" | "room";
	propertyName: string;
	propertyKey: string;
	dataType: string;
	unit: string;
	description: string;
}

/** 列表查询参数 */
export interface ModelDataListParams {
	pageNum: number;
	pageSize: number;
	modelName?: string;
	assetType?: string;
	dataType?: string;
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
		modelName: "取样泵",
		modelKey: "sampling_pump",
		assetType: "device",
		propertyName: "开关状态",
		propertyKey: "/114_FV201_KDFK",
		dataType: "BOOL",
		unit: "-",
		description: "取样泵启停状态",
	},
	{
		id: "model-002",
		modelName: "取样泵",
		modelKey: "sampling_pump",
		assetType: "device",
		propertyName: "运行频率",
		propertyKey: "/114_FV201_FREQ",
		dataType: "INT",
		unit: "Hz",
		description: "取样泵当前运行频率",
	},
	{
		id: "model-003",
		modelName: "反应釜",
		modelKey: "reactor",
		assetType: "device",
		propertyName: "温度",
		propertyKey: "/114_FV201_TEMP",
		dataType: "FLOAT",
		unit: "℃",
		description: "反应釜内部温度",
	},
	{
		id: "model-004",
		modelName: "房间监测",
		modelKey: "room_monitor",
		assetType: "room",
		propertyName: "氨气浓度",
		propertyKey: "/201_NH3",
		dataType: "FLOAT",
		unit: "ppm",
		description: "房间氨气浓度监测",
	},
	{
		id: "model-005",
		modelName: "房间监测",
		modelKey: "room_monitor",
		assetType: "room",
		propertyName: "湿度",
		propertyKey: "/ROOM_HUMIDITY",
		dataType: "FLOAT",
		unit: "%",
		description: "房间环境湿度",
	},
];

const recordsStore: ModelDataRecord[] = [...MOCK_RECORDS];

function filterRecords(params: ModelDataListParams): ModelDataRecord[] {
	const keyword = params.modelName?.trim().toLowerCase();

	return recordsStore.filter((item) => {
		if (keyword && !item.modelName.toLowerCase().includes(keyword)) {
			return false;
		}
		if (params.assetType && item.assetType !== params.assetType) {
			return false;
		}
		if (params.dataType && item.dataType !== params.dataType) {
			return false;
		}
		return true;
	});
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
