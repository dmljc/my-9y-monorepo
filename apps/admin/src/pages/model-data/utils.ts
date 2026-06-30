import type { ModelDataListParams } from "./api";

/** 筛选表单状态 */
export interface ModelDataFilter {
	modelName: string;
	assetType?: string;
	dataType?: string;
}

export const DEFAULT_FILTER: ModelDataFilter = {
	modelName: "",
	assetType: undefined,
	dataType: undefined,
};

export const ASSET_TYPE_OPTIONS = [
	{ label: "设备", value: "device" },
	{ label: "房间", value: "room" },
];

export const DATA_TYPE_OPTIONS = [
	{ label: "BOOL", value: "BOOL" },
	{ label: "INT", value: "INT" },
	{ label: "FLOAT", value: "FLOAT" },
	{ label: "STRING", value: "STRING" },
];

export const ASSET_TYPE_LABEL: Record<string, string> = {
	device: "设备",
	room: "房间",
};

/** 将筛选条件组装为列表查询参数 */
export function toListParams(
	pageNum: number,
	pageSize: number,
	filter: ModelDataFilter,
): ModelDataListParams {
	return {
		pageNum,
		pageSize,
		modelName: filter.modelName.trim() || undefined,
		assetType: filter.assetType,
		dataType: filter.dataType,
	};
}
