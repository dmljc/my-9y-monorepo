import type { DeviceRecordListParams } from "./api";

/** 筛选表单状态 */
export interface DeviceFilter {
	modelName: string;
	assetType?: string;
	assetName?: string;
	property?: string;
	dateRange: [string, string] | null;
}

export const DEFAULT_FILTER: DeviceFilter = {
	modelName: "",
	assetType: undefined,
	assetName: undefined,
	property: undefined,
	dateRange: null,
};

export const ASSET_TYPE_OPTIONS = [
	{ label: "设备", value: "device" },
	{ label: "房间", value: "room" },
];

export const ASSET_NAME_OPTIONS: Record<
	string,
	{ label: string; value: string }[]
> = {
	device: [
		{ label: "取样泵-A101", value: "取样泵-A101" },
		{ label: "反应釜-A114", value: "反应釜-A114" },
		{ label: "料线控制器", value: "料线控制器" },
	],
	room: [
		{ label: "101", value: "101" },
		{ label: "A区-201", value: "A区-201" },
		{ label: "B区-305", value: "B区-305" },
	],
};

export const PROPERTY_OPTIONS = [
	{ label: "开关状态", value: "开关状态" },
	{ label: "运行频率", value: "运行频率" },
	{ label: "温度", value: "温度" },
	{ label: "湿度", value: "湿度" },
];

/** 将筛选条件组装为列表查询参数 */
export function toListParams(
	pageNum: number,
	pageSize: number,
	filter: DeviceFilter,
): DeviceRecordListParams {
	const params: DeviceRecordListParams = {
		pageNum,
		pageSize,
		modelName: filter.modelName.trim() || undefined,
		assetType: filter.assetType,
		assetName: filter.assetName,
		property: filter.property,
	};

	if (filter.dateRange) {
		params.startTime = filter.dateRange[0];
		params.endTime = `${filter.dateRange[1]} 23:59:59`;
	}

	return params;
}

/** 从 URL 查询参数解析初始筛选（告警跳转场景） */
export function parseFilterFromSearch(
	search: string,
	base: DeviceFilter = DEFAULT_FILTER,
): DeviceFilter {
	const params = new URLSearchParams(search);
	const startTime = params.get("startTime");
	const endTime = params.get("endTime");
	const name = params.get("name");
	const type = params.get("type");

	return {
		...base,
		modelName: name ?? base.modelName,
		assetType: type === "room" || type === "device" ? type : base.assetType,
		dateRange:
			startTime && endTime
				? [startTime.slice(0, 10), endTime.slice(0, 10)]
				: base.dateRange,
	};
}
