import type { StatusFilter, WarningItem } from "./utils";
import { calcTodayStats, filterWarnings, MOCK_WARNINGS } from "./utils";

/** 告警列表查询参数 */
export interface WarningListParams {
	pageNum: number;
	pageSize: number;
	status?: StatusFilter;
	startTime?: string;
	endTime?: string;
}

/** 告警列表返回结果 */
export interface WarningListResult {
	list: WarningItem[];
	total: number;
	stats: ReturnType<typeof calcTodayStats>;
	pageNum: number;
	pageSize: number;
}

/** mock 数据内存副本（接入 API 后移除） */
const warningsStore: WarningItem[] = [...MOCK_WARNINGS];

/** 将筛选字段与分页参数组装为接口查询参数 */
export function toListParams(
	pageNum: number,
	pageSize: number,
	dateRange: [string, string] | null,
	status: StatusFilter,
): WarningListParams {
	const params: WarningListParams = {
		pageNum,
		pageSize,
		status,
	};

	if (dateRange) {
		params.startTime = dateRange[0];
		params.endTime = `${dateRange[1]} 23:59:59`;
	}

	return params;
}

function getFilteredWarnings(params: WarningListParams) {
	const dateRange =
		params.startTime && params.endTime
			? ([params.startTime.slice(0, 10), params.endTime.slice(0, 10)] as [
					string,
					string,
				])
			: null;

	return filterWarnings(warningsStore, params.status ?? "all", dateRange);
}

/** 获取告警列表（分页） */
export function list(params: WarningListParams): Promise<WarningListResult> {
	// return request.get("/api/warning/list", { params });
	const filtered = getFilteredWarnings(params);
	const { pageNum, pageSize } = params;
	const start = (pageNum - 1) * pageSize;

	return Promise.resolve({
		list: filtered.slice(start, start + pageSize),
		total: filtered.length,
		stats: calcTodayStats(warningsStore),
		pageNum,
		pageSize,
	});
}

/** 标记告警为已解决 */
export function processWarning(id: string): Promise<WarningItem> {
	// return request.put(`/api/warning/${id}/process`);
	const index = warningsStore.findIndex((item) => item.id === id);
	if (index === -1) {
		return Promise.reject(new Error("告警不存在"));
	}

	warningsStore[index] = {
		...warningsStore[index],
		status: "processed",
	};

	return Promise.resolve(warningsStore[index]);
}
