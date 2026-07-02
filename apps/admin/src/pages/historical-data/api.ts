// import { request } from "@/utils/request";

/** 设备分类数据类型 */
export interface DeviceCategory {
	key: string;
	title: string;
	children?: DeviceCategory[];
}

/** 设备数据记录类型 */
export interface DeviceRecord {
	id: string;
	modelName: string;
	pointName: string;
	pointId: string;
	assetType: string;
	assetName: string;
	property: string;
	type: string;
	value: string | number;
	time: string;
}

/** 设备数据查询参数 */
export interface DeviceRecordListParams {
	pageNum: number;
	pageSize: number;
	modelName?: string;
	assetType?: string;
	assetName?: string;
	property?: string;
	startTime?: string;
	endTime?: string;
}

/** 设备数据返回结果 */
interface DeviceRecordListResult {
	list: DeviceRecord[];
	total: number;
	pageNum: number;
	pageSize: number;
}

const MOCK_RECORDS: DeviceRecord[] = [
	{
		id: "device-001",
		modelName: "取样泵",
		pointName: "这也是一个名称",
		pointId: "/114_FV201_KDFK",
		assetType: "device",
		assetName: "取样泵-A101",
		property: "开关状态",
		type: "BOOL",
		value: 1,
		time: "2025-11-23 15:14:13",
	},
	{
		id: "device-002",
		modelName: "取样泵",
		pointName: "这也是一个名称",
		pointId: "/114_FV201_KDFK",
		assetType: "device",
		assetName: "取样泵-A101",
		property: "运行频率",
		type: "INT",
		value: 666,
		time: "2025-11-23 15:20:08",
	},
	{
		id: "device-003",
		modelName: "反应釜",
		pointName: "温度点位",
		pointId: "/114_FV201_TEMP",
		assetType: "device",
		assetName: "反应釜-A114",
		property: "温度",
		type: "FLOAT",
		value: 36.5,
		time: "2025-11-23 16:02:41",
	},
	{
		id: "device-004",
		modelName: "房间监测",
		pointName: "氨气浓度",
		pointId: "/201_NH3",
		assetType: "room",
		assetName: "A区-201",
		property: "湿度",
		type: "FLOAT",
		value: 12.8,
		time: "2025-11-24 09:15:00",
	},
];

const recordsStore: DeviceRecord[] = [...MOCK_RECORDS];

function filterRecords(params: DeviceRecordListParams): DeviceRecord[] {
	const keyword = params.modelName?.trim().toLowerCase();

	return recordsStore.filter((item) => {
		if (keyword && !item.modelName.toLowerCase().includes(keyword)) {
			return false;
		}
		if (params.assetType && item.assetType !== params.assetType) {
			return false;
		}
		if (params.assetName && item.assetName !== params.assetName) {
			return false;
		}
		if (params.property && item.property !== params.property) {
			return false;
		}
		if (params.startTime && params.endTime) {
			const itemTime = item.time.slice(0, 19);
			if (itemTime < params.startTime || itemTime > params.endTime) {
				return false;
			}
		}
		return true;
	});
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
