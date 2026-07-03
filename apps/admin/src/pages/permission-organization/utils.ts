import type { SysDept } from "./interface";

/** 树形表格节点 */
export type OrgTreeNode = SysDept & { children?: OrgTreeNode[] };

/** 新增/编辑组织表单值 */
export interface OrgFormValues {
	deptName: string;
	/** 0 表示顶级组织 */
	parentId: number;
	remark: string;
}

/** 上级组织：顶级占位值 */
export const TOP_PARENT_VALUE = 0;

/** 组织名称最大字符数 */
export const ORG_NAME_MAX_LENGTH = 30;

/** 组织描述最大字符数 */
export const ORG_DESCRIPTION_MAX_LENGTH = 200;

/** 最近一次列表加载的扁平组织缓存（供表单上级组织选项） */
let flatOrgsCache: SysDept[] = [];

/**
 * 写入扁平组织缓存。
 *
 * @param {SysDept[]} - 扁平组织列表。
 * @returns {void} - 无返回值。
 */
export function setFlatOrgsCache(depts: SysDept[]): void {
	flatOrgsCache = depts;
}

/**
 * 获取全部组织（扁平，供表单使用）。
 *
 * @returns {SysDept[]} - 扁平组织列表。
 */
export function getAllOrgs(): SysDept[] {
	return [...flatOrgsCache];
}

/**
 * 扁平列表 → 树形结构。
 *
 * @param {SysDept[]} - 扁平组织列表。
 * @returns {OrgTreeNode[]} - 树形组织列表。
 */
export function buildOrgTree(depts: SysDept[]): OrgTreeNode[] {
	const nodeMap = new Map<number, OrgTreeNode>();
	const roots: OrgTreeNode[] = [];

	for (const dept of depts) {
		if (dept.deptId === undefined) continue;
		nodeMap.set(dept.deptId, { ...dept, children: [] });
	}

	for (const dept of depts) {
		if (dept.deptId === undefined) continue;
		const node = nodeMap.get(dept.deptId);
		if (!node) continue;
		const parentId = dept.parentId;
		if (parentId && parentId !== 0 && nodeMap.has(parentId)) {
			nodeMap.get(parentId)?.children?.push(node);
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
		if (node.deptName?.includes(keyword) || children.length > 0) {
			result.push({
				...node,
				children: children.length ? children : undefined,
			});
		}
	}
	return result;
}

/**
 * 获取某节点的全部子孙 id（编辑时上级组织不可选自身及下级）。
 *
 * @param {SysDept[]} - 扁平组织列表。
 * @param {number} - 根节点 ID。
 * @returns {Set<number>} - 子孙节点 ID 集合。
 */
export function getDescendantIds(
	depts: SysDept[],
	rootId: number,
): Set<number> {
	const ids = new Set<number>();
	const walk = (parentId: number) => {
		for (const dept of depts) {
			if (
				dept.deptId !== undefined &&
				dept.parentId === parentId &&
				!ids.has(dept.deptId)
			) {
				ids.add(dept.deptId);
				walk(dept.deptId);
			}
		}
	};
	walk(rootId);
	return ids;
}

/**
 * 上级组织下拉选项。
 *
 * @param {SysDept[]} - 扁平组织列表。
 * @param {number} - 编辑时需排除的组织 ID。
 * @returns {{ value: number; label: string }[]} - 上级组织选项。
 */
export function getParentOptions(
	depts: SysDept[],
	excludeId?: number,
): { value: number; label: string }[] {
	const excluded = new Set<number>();
	if (excludeId !== undefined) {
		excluded.add(excludeId);
		for (const id of getDescendantIds(depts, excludeId)) {
			excluded.add(id);
		}
	}

	return [
		{ value: TOP_PARENT_VALUE, label: "无（顶级组织）" },
		...depts
			.filter(
				(item) =>
					item.deptId !== undefined && !excluded.has(item.deptId),
			)
			.map((item) => ({
				value: item.deptId as number,
				label: item.deptName ?? "",
			})),
	];
}

/**
 * 判断组织名称是否重复。
 *
 * @param {SysDept[]} - 扁平组织列表。
 * @param {string} - 待校验名称。
 * @param {number} - 编辑时需排除的组织 ID。
 * @returns {boolean} - 是否重复。
 */
export function isDuplicateOrgName(
	depts: SysDept[],
	name: string,
	excludeId?: number,
): boolean {
	return depts.some(
		(item) =>
			item.deptName === name &&
			(excludeId === undefined || item.deptId !== excludeId),
	);
}

/**
 * 导出组织数据为 JSON 文件。
 *
 * @param {SysDept[]} - 待导出组织列表。
 * @returns {void} - 无返回值。
 */
export function exportOrgsToJson(depts: SysDept[]): void {
	const blob = new Blob([JSON.stringify(depts, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `organizations-${Date.now()}.json`;
	link.click();
	URL.revokeObjectURL(url);
}
