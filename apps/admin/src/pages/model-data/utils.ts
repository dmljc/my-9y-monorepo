import {
	list as fetchDeviceDataListApi,
	remove as removeDeviceDataApi,
	sync as syncDeviceDataApi,
} from "./api";
import type { DeviceDataListResponse, DeviceDataSnapshot } from "./interface";

/**
 * 列表查询参数。
 */
export interface ModelDataListParams {
	pageNum: number;
	pageSize: number;
	modelName?: string;
	propertyName?: string;
}

/**
 * 列表返回结果。
 */
export interface ModelDataListResult {
	list: DeviceDataSnapshot[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/**
 * 获取物模型数据列表（分页）。
 *
 * @param {ModelDataListParams} - 列表查询参数。
 * @returns {ModelDataListResult} - 分页列表结果。
 */
export async function list(
	params: ModelDataListParams,
): Promise<ModelDataListResult> {
	const { pageNum, pageSize, modelName, propertyName } = params;
	const data: DeviceDataListResponse = await fetchDeviceDataListApi({
		pageNum,
		pageSize,
		modelName: modelName?.trim() || undefined,
		propertyName: propertyName?.trim() || undefined,
	});

	return {
		list: data.list ?? [],
		total: data.total ?? 0,
		pageNum: data.pageNum ?? pageNum,
		pageSize: data.pageSize ?? pageSize,
	};
}

/**
 * 删除物模型数据记录。
 *
 * @param {string} - 记录 ID。
 * @returns {void} - 无返回值。
 */
export async function remove(id: string): Promise<void> {
	await removeDeviceDataApi(id);
}

/**
 * 全量同步 IIoT 设备数据到本地。
 *
 * @returns {void} - 无返回值。
 */
export async function sync(): Promise<void> {
	await syncDeviceDataApi();
}
