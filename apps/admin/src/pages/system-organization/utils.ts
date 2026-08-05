import type { Key } from "react";
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
 * 收集树中可展开节点的 key（有子节点的 deptId）。
 *
 * @param {OrgTreeNode[]} - 树形组织列表。
 * @returns {Key[]} - 可展开行的 key 列表。
 */
export function collectExpandableKeys(nodes: OrgTreeNode[]): Key[] {
	const keys: Key[] = [];
	const walk = (list: OrgTreeNode[]) => {
		for (const node of list) {
			if (node.children?.length && node.deptId !== undefined) {
				keys.push(node.deptId);
				walk(node.children);
			}
		}
	};
	walk(nodes);
	return keys;
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

/** 上级组织 TreeSelect 节点 */
export interface ParentTreeNode {
	title: string;
	value: number;
	disabled?: boolean;
	children?: ParentTreeNode[];
}

/**
 * 上级组织树形选项（编辑时禁用自身及下级）。
 *
 * @param {SysDept[]} - 扁平组织列表。
 * @param {number} - 编辑时需禁用的组织 ID。
 * @returns {ParentTreeNode[]} - TreeSelect 树数据。
 */
export function getParentTreeData(
	depts: SysDept[],
	excludeId?: number,
): ParentTreeNode[] {
	const excluded = new Set<number>();
	if (excludeId !== undefined) {
		excluded.add(excludeId);
		for (const id of getDescendantIds(depts, excludeId)) {
			excluded.add(id);
		}
	}

	const mapNode = (node: OrgTreeNode): ParentTreeNode => ({
		title: node.deptName ?? "",
		value: node.deptId as number,
		disabled: excluded.has(node.deptId as number),
		children: node.children?.map(mapNode),
	});

	return [
		{ title: "无（顶级组织）", value: TOP_PARENT_VALUE },
		...buildOrgTree(depts).map(mapNode),
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
