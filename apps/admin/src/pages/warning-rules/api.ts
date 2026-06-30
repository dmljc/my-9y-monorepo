import type { RuleFormValues, WarningRule } from "./utils";
import { MOCK_RULES } from "./utils";

/** 列表查询参数 */
export interface RuleListParams {
	pageNum: number;
	pageSize: number;
	name?: string;
}

/** 列表返回结果 */
export interface RuleListResult {
	list: WarningRule[];
	total: number;
	pageNum: number;
	pageSize: number;
}

const rulesStore: WarningRule[] = [...MOCK_RULES];

/** 获取报警规则列表（分页） */
export function list(params: RuleListParams): Promise<RuleListResult> {
	// return request.get("/api/warning/rules", { params });
	const keyword = params.name?.trim().toLowerCase();
	const filtered = keyword
		? rulesStore.filter((item) => item.name.toLowerCase().includes(keyword))
		: rulesStore;
	const { pageNum, pageSize } = params;
	const start = (pageNum - 1) * pageSize;

	return Promise.resolve({
		list: filtered.slice(start, start + pageSize),
		total: filtered.length,
		pageNum,
		pageSize,
	});
}

/** 创建报警规则 */
export function create(values: RuleFormValues): Promise<WarningRule> {
	// return request.post("/api/warning/rules", values);
	const record: WarningRule = {
		id: `rule-${Date.now()}`,
		...values,
	};
	rulesStore.unshift(record);
	return Promise.resolve(record);
}

/** 更新报警规则 */
export function update(
	id: string,
	values: Partial<RuleFormValues & Pick<WarningRule, "enabled">>,
): Promise<WarningRule> {
	// return request.put(`/api/warning/rules/${id}`, values);
	const index = rulesStore.findIndex((item) => item.id === id);
	if (index === -1) {
		return Promise.reject(new Error("规则不存在"));
	}

	rulesStore[index] = {
		...rulesStore[index],
		...values,
	};

	return Promise.resolve(rulesStore[index]);
}

/** 删除报警规则 */
export function remove(id: string): Promise<void> {
	// return request.delete(`/api/warning/rules/${id}`);
	const index = rulesStore.findIndex((item) => item.id === id);
	if (index === -1) {
		return Promise.reject(new Error("规则不存在"));
	}

	rulesStore.splice(index, 1);
	return Promise.resolve();
}
