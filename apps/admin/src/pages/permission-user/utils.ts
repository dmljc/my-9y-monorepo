// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 用户列表行数据 */
export interface User {
	id: string;
	username: string;
	name: string;
	organizationId: string;
	organizationName: string;
	roleIds: string[];
	roleNames: string;
	createdAt: string;
}

/** 新增/编辑用户表单值 */
export interface UserFormValues {
	username: string;
	name: string;
	password?: string;
	organizationId: string;
	roleIds: string[];
}

/** 列表筛选条件，字段名与后端 query 参数对齐 */
export interface UserListFilters {
	username?: string;
	name?: string;
}

// ---------------------------------------------------------------------------
// 常量与校验规则（对接后端前在此集中维护）
// ---------------------------------------------------------------------------

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 10;

/** 用户账号最大字符数 */
export const USERNAME_MAX_LENGTH = 16;

/** 用户姓名最大字符数（中文） */
export const NAME_MAX_LENGTH = 8;

/** 密码最大字符数 */
export const PASSWORD_MAX_LENGTH = 16;

/** 账号：字母、数字、@ */
export const USERNAME_PATTERN = /^[A-Za-z0-9@]+$/;

/** 姓名：中文，最多 8 字 */
export const NAME_PATTERN = /^[\u4e00-\u9fa5]{1,8}$/;

/** 密码：字母、数字及常见符号 */
export const PASSWORD_PATTERN = /^[A-Za-z0-9!@#$%^&*._-]+$/;

/** 所属组织选项，后续可改为接口动态加载 */
export const ORGANIZATION_OPTIONS = [
	{ value: "org-network", label: "科信部/网络组" },
	{ value: "org-system", label: "科信部/系统组" },
	{ value: "org-frontend", label: "研发部/前端组" },
	{ value: "org-backend", label: "研发部/后端组" },
	{ value: "org-ops", label: "运维部/值班组" },
] as const;

/** 角色选项，后续可改为从角色管理接口获取 */
export const ROLE_OPTIONS = [
	{ value: "role-1", label: "超级管理员" },
	{ value: "role-2", label: "设备管理员" },
	{ value: "role-3", label: "普通用户" },
] as const;

// ---------------------------------------------------------------------------
// 数据转换与工具函数
// ---------------------------------------------------------------------------

/** 将筛选输入框的值转为列表查询参数 */
export function toListFilters(username: string, name: string): UserListFilters {
	return {
		username: username.trim() || undefined,
		name: name.trim() || undefined,
	};
}

/** 用户记录 → 表单初始值（编辑回填） */
export function recordToFormValues(record: User): UserFormValues {
	const { username, name, organizationId, roleIds } = record;
	return { username, name, organizationId, roleIds };
}

/** 根据组织 ID 解析展示名称 */
export function getOrganizationName(organizationId: string): string {
	return (
		ORGANIZATION_OPTIONS.find((item) => item.value === organizationId)
			?.label ?? ""
	);
}

/** 根据角色 ID 列表生成表格展示文案 */
export function buildRoleNames(roleIds: string[]): string {
	return roleIds
		.map(
			(id) => ROLE_OPTIONS.find((item) => item.value === id)?.label ?? "",
		)
		.filter(Boolean)
		.join(", ");
}

/** 校验用户账号是否重复 */
export function isDuplicateUsername(
	users: User[],
	username: string,
	excludeId?: string,
): boolean {
	return users.some(
		(item) =>
			item.username === username && (!excludeId || item.id !== excludeId),
	);
}

/** 导出用户数据为 JSON 文件（前端 mock，对接后端后可改为服务端导出） */
export function exportUsersToJson(users: User[]): void {
	const blob = new Blob([JSON.stringify(users, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `users-${Date.now()}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Mock 数据（对接后端后删除）
// ---------------------------------------------------------------------------

/** 生成模拟用户数据 */
export function generateMockUsers(): User[] {
	return [
		{
			id: "user-1",
			username: "SF00001",
			name: "张三",
			organizationId: "org-network",
			organizationName: "科信部/网络组",
			roleIds: ["role-1", "role-2"],
			roleNames: "超级管理员, 设备管理员",
			createdAt: "2025-01-01 00:00:00",
		},
		{
			id: "user-2",
			username: "SF00002",
			name: "李四",
			organizationId: "org-system",
			organizationName: "科信部/系统组",
			roleIds: ["role-2"],
			roleNames: "设备管理员",
			createdAt: "2025-02-15 10:30:00",
		},
		{
			id: "user-3",
			username: "SF00003",
			name: "王五",
			organizationId: "org-frontend",
			organizationName: "研发部/前端组",
			roleIds: ["role-3"],
			roleNames: "普通用户",
			createdAt: "2025-03-20 14:00:00",
		},
	];
}
