import type { LevelFormValues, WarningLevel } from "./utils";
import { MOCK_LEVELS } from "./utils";

/** 列表查询参数 */
export interface LevelListParams {
	pageNum: number;
	pageSize: number;
}

/** 列表返回结果 */
export interface LevelListResult {
	list: WarningLevel[];
	total: number;
	pageNum: number;
	pageSize: number;
}

const levelsStore: WarningLevel[] = [...MOCK_LEVELS];

/** 获取报警等级列表（分页） */
export function list(params: LevelListParams): Promise<LevelListResult> {
	// return request.get("/api/warning/levels", { params });
	const { pageNum, pageSize } = params;
	const start = (pageNum - 1) * pageSize;

	return Promise.resolve({
		list: levelsStore.slice(start, start + pageSize),
		total: levelsStore.length,
		pageNum,
		pageSize,
	});
}

/** 创建报警等级 */
export function create(values: LevelFormValues): Promise<WarningLevel> {
	// return request.post("/api/warning/levels", values);
	const record: WarningLevel = {
		id: `level-${Date.now()}`,
		...values,
	};
	levelsStore.unshift(record);
	return Promise.resolve(record);
}

/** 更新报警等级 */
export function update(
	id: string,
	values: LevelFormValues,
): Promise<WarningLevel> {
	// return request.put(`/api/warning/levels/${id}`, values);
	const index = levelsStore.findIndex((item) => item.id === id);
	if (index === -1) {
		return Promise.reject(new Error("等级不存在"));
	}

	levelsStore[index] = {
		...levelsStore[index],
		...values,
	};

	return Promise.resolve(levelsStore[index]);
}

/** 删除报警等级 */
export function remove(id: string): Promise<void> {
	// return request.delete(`/api/warning/levels/${id}`);
	const index = levelsStore.findIndex((item) => item.id === id);
	if (index === -1) {
		return Promise.reject(new Error("等级不存在"));
	}

	levelsStore.splice(index, 1);
	return Promise.resolve();
}
