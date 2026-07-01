import type {
	Organization,
	OrgFormValues,
	OrgListFilters,
	OrgTreeNode,
} from "./utils";
import {
	buildOrgTree,
	filterOrgTree,
	generateMockOrgs,
	hasChildOrgs,
} from "./utils";

/** mock 内存存储，对接后端后移除 */
const orgsStore: Organization[] = generateMockOrgs();

function findIndex(id: string): number {
	return orgsStore.findIndex((item) => item.id === id);
}

function filterOrgs(filters: OrgListFilters): Organization[] {
	const { name = "" } = filters;
	if (!name) return [...orgsStore];
	return orgsStore.filter((item) => item.name.includes(name));
}

/** 获取组织树形列表 */
export function list(filters: OrgListFilters = {}): Promise<OrgTreeNode[]> {
	// return request.get("/api/permission/organization", { params: filters });
	const { name = "" } = filters;
	const tree = buildOrgTree(orgsStore);
	return Promise.resolve(filterOrgTree(tree, name));
}

/** 创建组织 */
export function create(values: OrgFormValues): Promise<Organization> {
	// return request.post("/api/permission/organization", values);
	const record: Organization = {
		id: `org-${Date.now()}`,
		name: values.name.trim(),
		parentId: values.parentId || null,
		description: values.description.trim(),
	};
	orgsStore.push(record);
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

	const patch: Partial<Organization> = {};
	if (values.name !== undefined) patch.name = values.name.trim();
	if (values.description !== undefined) {
		patch.description = values.description.trim();
	}
	if (values.parentId !== undefined) {
		const parentId = values.parentId || null;
		if (parentId === id) {
			return Promise.reject(new Error("上级组织不能选择自身"));
		}
		patch.parentId = parentId;
	}

	orgsStore[index] = { ...orgsStore[index], ...patch };
	return Promise.resolve(orgsStore[index]);
}

/** 删除组织 */
export function remove(id: string): Promise<void> {
	// return request.delete(`/api/permission/organization/${id}`);
	const index = findIndex(id);
	if (index === -1) return Promise.reject(new Error("组织不存在"));
	if (hasChildOrgs(orgsStore, id)) {
		return Promise.reject(new Error("存在下级组织，无法删除"));
	}
	orgsStore.splice(index, 1);
	return Promise.resolve();
}

/** 获取全部组织（扁平，供表单使用） */
export function getAllOrgs(): Organization[] {
	return [...orgsStore];
}

/** 按筛选条件导出组织 */
export function exportOrgs(filters: OrgListFilters = {}): Organization[] {
	return filterOrgs(filters);
}
