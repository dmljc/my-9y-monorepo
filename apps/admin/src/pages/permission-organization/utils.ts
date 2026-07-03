import {
	create as createDeptApi,
	list as fetchDeptListApi,
	remove as removeDeptApi,
	update as updateDeptApi,
} from "./api";
import type { SysDept } from "./interface";

/** 组织节点（扁平存储） */
export interface Organization {
	id: string;
	name: string;
	parentId: string | null;
	description: string;
}

/** 树形表格节点 */
export type OrgTreeNode = Organization & { children?: OrgTreeNode[] };

/** 新增/编辑组织表单值 */
export interface OrgFormValues {
	name: string;
	/** 空字符串表示顶级组织 */
	parentId: string;
	description: string;
}

/** 列表筛选条件 */
export interface OrgListFilters {
	name?: string;
}

/** 上级组织：顶级占位值 */
export const TOP_PARENT_VALUE = "";

/** 组织名称最大字符数 */
export const ORG_NAME_MAX_LENGTH = 30;

/** 组织描述最大字符数 */
export const ORG_DESCRIPTION_MAX_LENGTH = 200;

/** 最近一次列表加载的扁平组织缓存（供表单上级组织选项） */
let flatOrgsCache: Organization[] = [];

/**
 * 后端组织实体 → 前端组织节点。
 *
 * @param {SysDept} - 后端组织实体。
 * @returns {Organization} - 前端组织节点。
 */
export function sysDeptToOrg(dept: SysDept): Organization {
	const parentId = dept.parentId;
	return {
		id: String(dept.deptId ?? ""),
		name: dept.deptName ?? "",
		parentId:
			parentId !== undefined && parentId !== 0 ? String(parentId) : null,
		description: dept.remark ?? "",
	};
}

/**
 * 表单值 → 后端组织提交体。
 *
 * @param {OrgFormValues} - 新增/编辑表单值。
 * @param {string} - 编辑时的组织 ID，新增时省略。
 * @returns {SysDept} - 后端组织提交体。
 */
export function formValuesToSysDept(
	values: OrgFormValues,
	deptId?: string,
): SysDept {
	const payload: SysDept = {
		deptName: values.name.trim(),
		parentId: values.parentId ? Number(values.parentId) : 0,
		remark: values.description.trim(),
	};

	if (deptId) {
		payload.deptId = Number(deptId);
	}

	return payload;
}

/**
 * 扁平列表 → 树形结构。
 *
 * @param {Organization[]} - 扁平组织列表。
 * @returns {OrgTreeNode[]} - 树形组织列表。
 */
export function buildOrgTree(orgs: Organization[]): OrgTreeNode[] {
	const nodeMap = new Map<string, OrgTreeNode>();
	const roots: OrgTreeNode[] = [];

	for (const org of orgs) {
		nodeMap.set(org.id, { ...org, children: [] });
	}

	for (const org of orgs) {
		const node = nodeMap.get(org.id);
		if (!node) continue;
		if (org.parentId && nodeMap.has(org.parentId)) {
			nodeMap.get(org.parentId)?.children?.push(node);
		} else {
			roots.push(node);
		}
	}

	const pruneEmpty = (nodes: OrgTreeNode[]): OrgTreeNode[] =>
		nodes.map((node) => ({
			...node,
			children: node.children?.length
				? pruneEmpty(node.children)
				: undefined,
		}));

	return pruneEmpty(roots);
}

/**
 * 按名称筛选树：保留匹配节点及其祖先。
 *
 * @param {OrgTreeNode[]} - 树形组织列表。
 * @param {string} - 组织名称关键词。
 * @returns {OrgTreeNode[]} - 筛选后的树形列表。
 */
export function filterOrgTree(
	nodes: OrgTreeNode[],
	keyword: string,
): OrgTreeNode[] {
	if (!keyword) return nodes;

	const result: OrgTreeNode[] = [];
	for (const node of nodes) {
		const children = node.children
			? filterOrgTree(node.children, keyword)
			: [];
		if (node.name.includes(keyword) || children.length > 0) {
			result.push({
				...node,
				children: children.length ? children : undefined,
			});
		}
	}
	return result;
}

/**
 * 组织记录 → 表单初始值。
 *
 * @param {Organization} - 组织节点。
 * @returns {OrgFormValues} - 表单初始值。
 */
export function recordToFormValues(record: Organization): OrgFormValues {
	return {
		name: record.name,
		parentId: record.parentId ?? TOP_PARENT_VALUE,
		description: record.description,
	};
}

/**
 * 获取某节点的全部子孙 id（编辑时上级组织不可选自身及下级）。
 *
 * @param {Organization[]} - 扁平组织列表。
 * @param {string} - 根节点 ID。
 * @returns {Set<string>} - 子孙节点 ID 集合。
 */
export function getDescendantIds(
	orgs: Organization[],
	rootId: string,
): Set<string> {
	const ids = new Set<string>();
	const walk = (parentId: string) => {
		for (const org of orgs) {
			if (org.parentId === parentId && !ids.has(org.id)) {
				ids.add(org.id);
				walk(org.id);
			}
		}
	};
	walk(rootId);
	return ids;
}

/**
 * 上级组织下拉选项。
 *
 * @param {Organization[]} - 扁平组织列表。
 * @param {string} - 编辑时需排除的组织 ID。
 * @returns {{ value: string; label: string }[]} - 上级组织选项。
 */
export function getParentOptions(
	orgs: Organization[],
	excludeId?: string,
): { value: string; label: string }[] {
	const excluded = new Set<string>();
	if (excludeId) {
		excluded.add(excludeId);
		for (const id of getDescendantIds(orgs, excludeId)) {
			excluded.add(id);
		}
	}

	return [
		{ value: TOP_PARENT_VALUE, label: "无（顶级组织）" },
		...orgs
			.filter((item) => !excluded.has(item.id))
			.map((item) => ({ value: item.id, label: item.name })),
	];
}

/**
 * 判断组织名称是否重复。
 *
 * @param {Organization[]} - 扁平组织列表。
 * @param {string} - 待校验名称。
 * @param {string} - 编辑时需排除的组织 ID。
 * @returns {boolean} - 是否重复。
 */
export function isDuplicateOrgName(
	orgs: Organization[],
	name: string,
	excludeId?: string,
): boolean {
	return orgs.some(
		(item) => item.name === name && (!excludeId || item.id !== excludeId),
	);
}

/**
 * 导出组织数据为 JSON 文件。
 *
 * @param {Organization[]} - 待导出组织列表。
 * @returns {void} - 无返回值。
 */
export function exportOrgsToJson(orgs: Organization[]): void {
	const blob = new Blob([JSON.stringify(orgs, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `organizations-${Date.now()}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// 接口编排（api 薄封装之上的业务转换）
// ---------------------------------------------------------------------------

/**
 * 拉取并缓存扁平组织列表。
 *
 * @param {OrgListFilters} - 列表筛选条件。
 * @returns {Organization[]} - 扁平组织列表。
 */
async function fetchFlatOrgs(
	filters: OrgListFilters = {},
): Promise<Organization[]> {
	const data: SysDept[] = await fetchDeptListApi({
		deptName: filters.name,
	});
	return (data ?? []).map(sysDeptToOrg);
}

/**
 * 获取组织树形列表。
 *
 * @param {OrgListFilters} - 列表筛选条件。
 * @returns {OrgTreeNode[]} - 树形组织列表。
 */
export async function list(
	filters: OrgListFilters = {},
): Promise<OrgTreeNode[]> {
	const orgs = await fetchFlatOrgs();
	flatOrgsCache = orgs;
	const tree = buildOrgTree(orgs);
	return filterOrgTree(tree, filters.name?.trim() ?? "");
}

/**
 * 创建组织。
 *
 * @param {OrgFormValues} - 新增表单值。
 * @returns {void} - 无返回值。
 */
export async function create(values: OrgFormValues): Promise<void> {
	await createDeptApi(formValuesToSysDept(values));
}

/**
 * 更新组织。
 *
 * @param {string} - 组织 ID。
 * @param {Partial<OrgFormValues>} - 编辑表单值。
 * @returns {void} - 无返回值。
 */
export async function update(
	id: string,
	values: Partial<OrgFormValues>,
): Promise<void> {
	await updateDeptApi(
		formValuesToSysDept(
			{
				name: values.name ?? "",
				parentId: values.parentId ?? TOP_PARENT_VALUE,
				description: values.description ?? "",
			},
			id,
		),
	);
}

/**
 * 删除组织。
 *
 * @param {string} - 组织 ID。
 * @returns {void} - 无返回值。
 */
export async function remove(id: string): Promise<void> {
	if (!id) {
		throw new Error("无效的组织 ID");
	}

	await removeDeptApi(id);
}

/**
 * 获取全部组织（扁平，供表单使用）。
 *
 * @returns {Organization[]} - 扁平组织列表。
 */
export function getAllOrgs(): Organization[] {
	return [...flatOrgsCache];
}

/**
 * 按筛选条件获取待导出组织。
 *
 * @param {OrgListFilters} - 列表筛选条件。
 * @returns {Organization[]} - 待导出组织列表。
 */
export async function exportOrgs(
	filters: OrgListFilters = {},
): Promise<Organization[]> {
	const orgs = await fetchFlatOrgs();
	const keyword = filters.name?.trim();
	if (!keyword) return orgs;
	return orgs.filter((org) => org.name.includes(keyword));
}
