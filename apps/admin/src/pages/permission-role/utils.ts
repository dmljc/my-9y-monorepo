export interface Role {
	id: string;
	name: string;
	code: string;
	description: string;
	createdAt: string;
}

export interface RoleFormValues {
	name: string;
	code: string;
	description: string;
}

/** 角色名称最大字符数 */
export const ROLE_NAME_MAX_LENGTH = 20;

/** 角色编码最大字符数 */
export const ROLE_CODE_MAX_LENGTH = 30;

/** 角色描述最大字符数 */
export const ROLE_DESCRIPTION_MAX_LENGTH = 100;

/** 生成模拟角色数据 */
export function generateMockRoles(): Role[] {
	return [
		{
			id: "role-1",
			name: "超级管理员",
			code: "super_admin",
			description: "拥有系统全部权限",
			createdAt: "2025-01-01 00:00:00",
		},
		{
			id: "role-2",
			name: "设备管理员",
			code: "device_admin",
			description: "管理设备相关功能",
			createdAt: "2025-02-15 10:30:00",
		},
		{
			id: "role-3",
			name: "普通用户",
			code: "normal_user",
			description: "仅查看权限",
			createdAt: "2025-03-20 14:00:00",
		},
	];
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

export function isDuplicateRoleCode(
	roles: Role[],
	code: string,
	excludeId?: string,
): boolean {
	return roles.some(
		(item) => item.code === code && (!excludeId || item.id !== excludeId),
	);
}
