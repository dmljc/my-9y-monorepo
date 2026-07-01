import dayjs from "dayjs";

export interface PermissionNode {
	key: string;
	title: string;
	children?: PermissionNode[];
}

export interface Role {
	id: string;
	name: string;
	code: string;
	description: string;
	userCount: number;
	hasAllPermissions: boolean;
	permissionCount: number;
	permissionIds: string[];
	createdAt: string;
}

export interface RoleFormValues {
	name: string;
	description: string;
}

/** 超级管理员角色编码，系统内置不可删除或分配权限 */
export const SUPER_ADMIN_ROLE_CODE = "super_admin";

/** 角色名称最大字符数 */
export const ROLE_NAME_MAX_LENGTH = 20;

/** 角色描述最大字符数 */
export const ROLE_DESCRIPTION_MAX_LENGTH = 100;

/** 权限树 mock 数据，对接后端后替换 */
export const ROLE_PERMISSION_TREE: PermissionNode[] = [
	{ key: "dashboard", title: "大屏" },
	{ key: "statistics", title: "统计分析" },
	{
		key: "warning",
		title: "警告管理",
		children: [
			{ key: "warning:list", title: "警告列表" },
			{ key: "warning:rules", title: "警告规则" },
			{ key: "warning:levels", title: "报警等级管理" },
		],
	},
	{
		key: "device",
		title: "设备管理",
		children: [{ key: "device:inspection-ledger", title: "点检台账" }],
	},
	{ key: "historical-data", title: "历史数据" },
	{ key: "model-data", title: "物模型数据" },
	{ key: "reverse-control", title: "设备反控" },
	{
		key: "permission",
		title: "角色权限",
		children: [
			{ key: "permission:role", title: "角色管理" },
			{ key: "permission:user", title: "用户管理" },
			{ key: "permission:organization", title: "组织管理" },
		],
	},
];

/** 生成模拟角色数据 */
export function generateMockRoles(): Role[] {
	return [
		{
			id: "role-1",
			name: "超级管理员",
			code: SUPER_ADMIN_ROLE_CODE,
			description: "拥有系统所有权限",
			userCount: 1,
			hasAllPermissions: true,
			permissionCount: 0,
			permissionIds: [],
			createdAt: "",
		},
		{
			id: "role-2",
			name: "设备管理员",
			code: "device_admin",
			description: "管理设备相关功能",
			userCount: 5,
			hasAllPermissions: false,
			permissionCount: 5,
			permissionIds: [
				"device",
				"device:inspection-ledger",
				"historical-data",
				"model-data",
				"reverse-control",
			],
			createdAt: "2025-02-15 10:30:00",
		},
		{
			id: "role-3",
			name: "普通用户",
			code: "normal_user",
			description: "仅查看权限",
			userCount: 12,
			hasAllPermissions: false,
			permissionCount: 2,
			permissionIds: ["dashboard", "statistics"],
			createdAt: "2025-03-20 14:00:00",
		},
	];
}

export function isSystemRole(role: Role): boolean {
	return role.code === SUPER_ADMIN_ROLE_CODE;
}

export function formatRoleCreatedAt(role: Role): string {
	if (isSystemRole(role) || !role.createdAt) {
		return "-";
	}
	return dayjs(role.createdAt).format("YYYY-MM-DD");
}

export function formatPermissionCount(role: Role): string {
	if (role.hasAllPermissions) {
		return "所有";
	}
	return String(role.permissionCount);
}

export function getPermissionLeafKeys(
	tree: PermissionNode[] = ROLE_PERMISSION_TREE,
): string[] {
	const keys: string[] = [];
	const walk = (nodes: PermissionNode[]) => {
		for (const node of nodes) {
			if (node.children?.length) {
				walk(node.children);
			} else {
				keys.push(node.key);
			}
		}
	};
	walk(tree);
	return keys;
}

export function normalizePermissionIds(checkedKeys: string[]): string[] {
	const leafKeys = new Set(getPermissionLeafKeys());
	return checkedKeys.filter((key) => leafKeys.has(key));
}

export function isDuplicateRoleName(
	roles: Role[],
	name: string,
	excludeId?: string,
): boolean {
	return roles.some(
		(item) => item.name === name && (!excludeId || item.id !== excludeId),
	);
}
