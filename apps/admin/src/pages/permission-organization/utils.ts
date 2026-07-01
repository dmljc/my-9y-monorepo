export interface Organization {
	id: string;
	name: string;
	code: string;
	parentName: string;
	leader: string;
	sortOrder: number;
	createdAt: string;
}

export interface OrgFormValues {
	name: string;
	code: string;
	parentName: string;
	leader: string;
	sortOrder: number;
}

/** 组织名称最大字符数 */
export const ORG_NAME_MAX_LENGTH = 30;

/** 组织编码最大字符数 */
export const ORG_CODE_MAX_LENGTH = 30;

/** 负责人最大字符数 */
export const ORG_LEADER_MAX_LENGTH = 20;

/** 排序最小值 */
export const SORT_ORDER_MIN = 0;

/** 排序最大值 */
export const SORT_ORDER_MAX = 999;

/** 生成模拟组织数据 */
export function generateMockOrgs(): Organization[] {
	return [
		{
			id: "org-1",
			name: "总公司",
			code: "headquarters",
			parentName: "-",
			leader: "王总",
			sortOrder: 1,
			createdAt: "2025-01-01 00:00:00",
		},
		{
			id: "org-2",
			name: "研发部",
			code: "rd_dept",
			parentName: "总公司",
			leader: "张经理",
			sortOrder: 2,
			createdAt: "2025-02-01 09:00:00",
		},
		{
			id: "org-3",
			name: "运维部",
			code: "ops_dept",
			parentName: "总公司",
			leader: "李经理",
			sortOrder: 3,
			createdAt: "2025-03-01 10:00:00",
		},
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

export function isDuplicateOrgCode(
	orgs: Organization[],
	code: string,
	excludeId?: string,
): boolean {
	return orgs.some(
		(item) => item.code === code && (!excludeId || item.id !== excludeId),
	);
}
