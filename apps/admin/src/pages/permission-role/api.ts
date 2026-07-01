import type { Role, RoleFormValues } from "./utils";
import { generateMockRoles } from "./utils";

// mock 内存存储
const rolesStore: Role[] = generateMockRoles();

function findIndex(id: string): number {
	return rolesStore.findIndex((item) => item.id === id);
}

export interface RoleListParams {
	pageNum: number;
	pageSize: number;
	name?: string;
}

export interface RoleListResult {
	list: Role[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/** 获取角色列表（分页） */
export function list(params: RoleListParams): Promise<RoleListResult> {
	// return request.get("/api/permission/role", { params });
	const { pageNum, pageSize, name = "" } = params;
	let filtered = rolesStore;
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

/** 创建角色 */
export function create(values: RoleFormValues): Promise<Role> {
	// return request.post("/api/permission/role", values);
	const record: Role = {
		id: `role-${Date.now()}`,
		...values,
		createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
	};
	rolesStore.unshift(record);
	return Promise.resolve(record);
}

/** 更新角色 */
export function update(
	id: string,
	values: Partial<RoleFormValues>,
): Promise<Role> {
	// return request.put(`/api/permission/role/${id}`, values);
	const index = findIndex(id);
	if (index === -1) return Promise.reject(new Error("角色不存在"));
	rolesStore[index] = { ...rolesStore[index], ...values };
	return Promise.resolve(rolesStore[index]);
}

/** 删除角色 */
export function remove(id: string): Promise<void> {
	// return request.delete(`/api/permission/role/${id}`);
	const index = findIndex(id);
	if (index === -1) return Promise.reject(new Error("角色不存在"));
	rolesStore.splice(index, 1);
	return Promise.resolve();
}

/** 获取全部角色（供表单下拉等使用） */
export function getAllRoles(): Role[] {
	return [...rolesStore];
}
