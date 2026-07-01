import type { Organization, OrgFormValues } from "./utils";
import { generateMockOrgs } from "./utils";

// mock 内存存储
const orgsStore: Organization[] = generateMockOrgs();

function findIndex(id: string): number {
	return orgsStore.findIndex((item) => item.id === id);
}

export interface OrgListParams {
	pageNum: number;
	pageSize: number;
	name?: string;
}

export interface OrgListResult {
	list: Organization[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/** 获取组织列表（分页） */
export function list(params: OrgListParams): Promise<OrgListResult> {
	// return request.get("/api/permission/organization", { params });
	const { pageNum, pageSize, name = "" } = params;
	let filtered = orgsStore;
	if (name) {
		filtered = filtered.filter((item) => item.name.includes(name));
	}
	const start = (pageNum - 1) * pageSize;
	return Promise.resolve({
		list: filtered.slice(start, start + pageSize),
		total: filtered.length,
		pageNum,
		pageSize,
	});
}

/** 创建组织 */
export function create(values: OrgFormValues): Promise<Organization> {
	// return request.post("/api/permission/organization", values);
	const record: Organization = {
		id: `org-${Date.now()}`,
		...values,
		createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
	};
	orgsStore.unshift(record);
	return Promise.resolve(record);
}

/** 更新组织 */
export function update(
	id: string,
	values: Partial<OrgFormValues>,
): Promise<Organization> {
	// return request.put(`/api/permission/organization/${id}`, values);
	const index = findIndex(id);
	if (index === -1) return Promise.reject(new Error("组织不存在"));
	orgsStore[index] = { ...orgsStore[index], ...values };
	return Promise.resolve(orgsStore[index]);
}

/** 删除组织 */
export function remove(id: string): Promise<void> {
	// return request.delete(`/api/permission/organization/${id}`);
	const index = findIndex(id);
	if (index === -1) return Promise.reject(new Error("组织不存在"));
	orgsStore.splice(index, 1);
	return Promise.resolve();
}

/** 获取全部组织 */
export function getAllOrgs(): Organization[] {
	return [...orgsStore];
}
