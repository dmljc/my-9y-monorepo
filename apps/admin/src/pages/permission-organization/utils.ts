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

/** 生成模拟组织数据（扁平） */
export function generateMockOrgs(): Organization[] {
	return [
		{ id: "org-1", name: "97", parentId: null, description: "一级组织" },
		{ id: "org-2", name: "714", parentId: "org-1", description: "" },
		{ id: "org-3", name: "001组", parentId: "org-2", description: "班组" },
		{ id: "org-4", name: "715", parentId: "org-1", description: "" },
		{
			id: "org-5",
			name: "科信部",
			parentId: null,
			description: "信息化建设部门",
		},
		{
			id: "org-6",
			name: "网络组",
			parentId: "org-5",
			description: "网络运维",
		},
	];
}

/** 扁平列表 → 树形结构 */
export function buildOrgTree(orgs: Organization[]): OrgTreeNode[] {
	const nodeMap = new Map<string, OrgTreeNode>();
	const roots: OrgTreeNode[] = [];

	for (const org of orgs) {
		nodeMap.set(org.id, { ...org, children: [] });
	}

	for (const org of orgs) {
		const node = nodeMap.get(org.id)!;
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

/** 按名称筛选树：保留匹配节点及其祖先 */
export function filterOrgTree(
	nodes: OrgTreeNode[],
	keyword: string,
): OrgTreeNode[] {
	if (!keyword) return nodes;

	return nodes
		.map((node) => {
			const children = node.children
				? filterOrgTree(node.children, keyword)
				: [];
			if (node.name.includes(keyword) || children.length > 0) {
				return {
					...node,
					children: children.length ? children : undefined,
				};
			}
			return null;
		})
		.filter((node): node is OrgTreeNode => node !== null);
}

/** 组织记录 → 表单初始值 */
export function recordToFormValues(record: Organization): OrgFormValues {
	return {
		name: record.name,
		parentId: record.parentId ?? TOP_PARENT_VALUE,
		description: record.description,
	};
}

/** 获取某节点的全部子孙 id（编辑时上级组织不可选自身及下级） */
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

/** 上级组织下拉选项 */
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

export function isDuplicateOrgName(
	orgs: Organization[],
	name: string,
	excludeId?: string,
): boolean {
	return orgs.some(
		(item) => item.name === name && (!excludeId || item.id !== excludeId),
	);
}

export function hasChildOrgs(orgs: Organization[], id: string): boolean {
	return orgs.some((item) => item.parentId === id);
}

/** 导出组织数据为 JSON */
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
