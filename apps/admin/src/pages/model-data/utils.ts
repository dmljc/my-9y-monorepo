import type { ModelDataListParams } from "./api";

/** 将筛选条件组装为列表查询参数 */
export function toListParams(
	pageNum: number,
	pageSize: number,
	deviceName: string,
): ModelDataListParams {
	return {
		pageNum,
		pageSize,
		deviceName: deviceName.trim() || undefined,
	};
}
