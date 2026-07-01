/** 用户状态 */
export type UserStatus = "enabled" | "disabled";

export interface User {
	id: string;
	username: string;
	realName: string;
	roleName: string;
	phone: string;
	email: string;
	status: UserStatus;
	createdAt: string;
}

export interface UserFormValues {
	username: string;
	realName: string;
	roleName: string;
	phone: string;
	email: string;
	status: UserStatus;
}

/** 用户名最大字符数 */
export const USERNAME_MAX_LENGTH = 20;

/** 真实姓名最大字符数 */
export const REAL_NAME_MAX_LENGTH = 20;

/** 手机号最大字符数 */
export const PHONE_MAX_LENGTH = 11;

/** 邮箱最大字符数 */
export const EMAIL_MAX_LENGTH = 50;

/** 用户状态选项 */
export const USER_STATUS_OPTIONS = [
	{ label: "启用", value: "enabled" },
	{ label: "禁用", value: "disabled" },
] as const;

/** 用户状态标签颜色 */
export const USER_STATUS_COLOR: Record<UserStatus, string> = {
	enabled: "green",
	disabled: "red",
};

/** 用户状态标签文本 */
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
	enabled: "启用",
	disabled: "禁用",
};

/** 生成模拟用户数据 */
export function generateMockUsers(): User[] {
	return [
		{
			id: "user-1",
			username: "admin",
			realName: "系统管理员",
			roleName: "超级管理员",
			phone: "13800000001",
			email: "admin@example.com",
			status: "enabled",
			createdAt: "2025-01-01 00:00:00",
		},
		{
			id: "user-2",
			username: "zhangsan",
			realName: "张三",
			roleName: "设备管理员",
			phone: "13800000002",
			email: "zhangsan@example.com",
			status: "enabled",
			createdAt: "2025-02-15 10:30:00",
		},
		{
			id: "user-3",
			username: "lisi",
			realName: "李四",
			roleName: "普通用户",
			phone: "13800000003",
			email: "lisi@example.com",
			status: "disabled",
			createdAt: "2025-03-20 14:00:00",
		},
	];
}

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
