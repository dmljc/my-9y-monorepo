import {
	getDeptTree as fetchDeptTreeApi,
	listRoles as fetchRoleListApi,
	list as fetchUserListApi,
} from "./api";
import type {
	DeptTreeNode,
	SysRole,
	SysUser,
	UserListQuery,
} from "./interface";

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
	organizationId: string | number;
	roleIds: string[];
}

/** 列表筛选条件 */
export interface UserListFilters {
	username?: string;
	name?: string;
}

/** 下拉选项 */
export interface SelectOption {
	value: string;
	label: string;
}

/** 用户列表查询参数 */
export interface UserListParams extends UserListFilters {
	pageNum: number;
	pageSize: number;
}

/** 用户列表查询结果 */
export interface UserListResult {
	list: User[];
	total: number;
	pageNum: number;
	pageSize: number;
}

// ---------------------------------------------------------------------------
// 常量与校验规则
// ---------------------------------------------------------------------------

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 25;

/** 姓名筛选时一次拉取的上限（后端 nickName 未生效，需客户端过滤） */
const MAX_FETCH_PAGE_SIZE = 10_000;

/** 用户姓名最大字符数 */
export const NAME_MAX_LENGTH = 30;

/** 姓名：中文、字母、数字 */
export const NAME_PATTERN = /^[\u4e00-\u9fa5A-Za-z0-9]{1,30}$/;

/** 编辑用户时密码框占位符，表示保留原密码。 */
export const EDIT_PASSWORD_PLACEHOLDER = "************";

// ---------------------------------------------------------------------------
// 数据转换与工具函数
// ---------------------------------------------------------------------------

/**
 * 从用户实体解析角色 ID 列表。
 *
 * @param {SysUser} - 后端用户实体。
 * @param {string[]} - 外部传入的角色 ID（详情接口 envelope 等）。
 * @returns {string[]} - 角色 ID 列表。
 */
function resolveRoleIds(sysUser: SysUser, override: string[] = []): string[] {
	if (override.length > 0) {
		return override;
	}
	if (typeof sysUser.roleIds === "string" && sysUser.roleIds.trim()) {
		return sysUser.roleIds
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean);
	}
	if (Array.isArray(sysUser.roleIds) && sysUser.roleIds.length) {
		return sysUser.roleIds.map(String);
	}
	if (sysUser.roleId !== undefined && sysUser.roleId !== null) {
		return [String(sysUser.roleId)];
	}
	const fromRoles = (sysUser.roles ?? [])
		.map((role) => role.roleId)
		.filter((id): id is number => id !== undefined && id !== null)
		.map(String);
	if (fromRoles.length > 0) {
		return fromRoles;
	}
	return [];
}

/**
 * 从用户实体解析角色名称展示文案。
 *
 * @param {SysUser} - 后端用户实体。
 * @param {string[]} - 角色 ID 列表。
 * @param {Record<string, string>} - 角色 ID 到名称的映射。
 * @returns {string} - 逗号分隔的角色名称。
 */
function resolveRoleNames(
	sysUser: SysUser,
	roleIds: string[],
	roleNameMap: Record<string, string>,
): string {
	if (sysUser.roleNames?.trim()) {
		return sysUser.roleNames.trim();
	}
	const fromRolesArray = (sysUser.roles ?? [])
		.map((role) =>
			typeof role === "object" && role !== null
				? ((role as SysRole).roleName ?? "")
				: "",
		)
		.filter(Boolean)
		.join(", ");
	if (fromRolesArray) {
		return fromRolesArray;
	}
	if (sysUser.roleName?.trim()) {
		return sysUser.roleName.trim();
	}
	return buildRoleNames(roleIds, roleNameMap);
}

/**
 * 后端用户实体 → 前端列表行数据。
 *
 * @param {SysUser} - 后端用户实体。
 * @param {string[]} - 角色 ID 列表（详情 envelope 等场景可覆盖）。
 * @param {Record<string, string>} - 角色 ID 到名称的映射。
 * @returns {User} - 前端列表行数据。
 */
export function sysUserToUser(
	sysUser: SysUser,
	roleIds: string[] = [],
	roleNameMap: Record<string, string> = {},
): User {
	const resolvedRoleIds = resolveRoleIds(sysUser, roleIds);

	return {
		id: String(sysUser.userId ?? ""),
		username: sysUser.userName ?? "",
		name: sysUser.nickName ?? "",
		organizationId: String(sysUser.deptId ?? ""),
		organizationName: sysUser.dept?.deptName ?? sysUser.deptName ?? "",
		roleIds: resolvedRoleIds,
		roleNames: resolveRoleNames(sysUser, resolvedRoleIds, roleNameMap),
		createdAt: sysUser.createTime ?? "",
	};
}

/**
 * 根据角色 ID 列表生成表格展示文案。
 *
 * @param {string[]} - 角色 ID 列表。
 * @param {Record<string, string>} - 角色 ID 到名称的映射。
 * @returns {string} - 逗号分隔的角色名称。
 */
export function buildRoleNames(
	roleIds: string[],
	roleNameMap: Record<string, string> = {},
): string {
	return roleIds
		.map((id) => roleNameMap[id] ?? "")
		.filter(Boolean)
		.join(", ");
}

// ---------------------------------------------------------------------------
// 接口编排（api 薄封装之上的业务转换）
// ---------------------------------------------------------------------------

/** 角色 ID → 名称缓存，避免重复请求 */
let roleNameMapCache: Record<string, string> | null = null;

/**
 * 前端列表参数 → 后端查询参数。
 *
 * @param {UserListParams} - 前端列表查询参数。
 * @returns {UserListQuery} - 后端查询参数。
 */
function toUserListQuery(params: UserListParams): UserListQuery {
	const { pageNum, pageSize, username, name } = params;
	return {
		pageNum,
		pageSize,
		userName: username?.trim(),
		nickName: name?.trim(),
	};
}

/**
 * 按后端用户实体的 nickName 过滤（客户端，list 接口 nickName 参数未生效）。
 *
 * @param {SysUser[]} - 列表原始行。
 * @param {string} - 姓名关键字。
 * @returns {SysUser[]} - 过滤后的列表。
 */
function filterSysUsersByName(rows: SysUser[], keyword?: string): SysUser[] {
	const name = keyword?.trim();
	if (!name) return rows;
	return rows.filter((row) => (row.nickName ?? "").includes(name));
}

/**
 * 对列表原始行做内存分页。
 *
 * @param {SysUser[]} - 列表原始行。
 * @param {number} - 页码。
 * @param {number} - 每页条数。
 * @returns {{ pageRows: SysUser[]; total: number }} - 当前页数据与总数。
 */
function paginateSysUsers(
	rows: SysUser[],
	pageNum: number,
	pageSize: number,
): { pageRows: SysUser[]; total: number } {
	const start = (pageNum - 1) * pageSize;
	return {
		pageRows: rows.slice(start, start + pageSize),
		total: rows.length,
	};
}

/**
 * 从用户列表接口响应中解析 rows 与 total。
 *
 * @param {unknown} - 用户列表接口原始响应。
 * @returns {{ rows: SysUser[]; total: number }} - 列表数据与总数。
 */
function parseUserListResponse(data: unknown): {
	rows: SysUser[];
	total: number;
} {
	if (Array.isArray(data)) {
		return { rows: data as SysUser[], total: data.length };
	}
	if (!data || typeof data !== "object") {
		return { rows: [], total: 0 };
	}

	const record = data as Record<string, unknown>;

	if (Array.isArray(record.rows)) {
		return {
			rows: record.rows as SysUser[],
			total:
				typeof record.total === "number"
					? record.total
					: record.rows.length,
		};
	}

	if (Array.isArray(record.list)) {
		return {
			rows: record.list as SysUser[],
			total:
				typeof record.total === "number"
					? record.total
					: record.list.length,
		};
	}

	if (Array.isArray(record.data)) {
		return {
			rows: record.data as SysUser[],
			total:
				typeof record.total === "number"
					? record.total
					: record.data.length,
		};
	}

	if (
		record.data &&
		typeof record.data === "object" &&
		!Array.isArray(record.data)
	) {
		return parseUserListResponse(record.data);
	}

	return { rows: [], total: 0 };
}

/**
 * 从角色列表接口响应中解析 rows。
 *
 * @param {unknown} - 角色列表接口原始响应。
 * @returns {SysRole[]} - 角色实体列表。
 */
function parseRoleRows(data: unknown): SysRole[] {
	if (Array.isArray(data)) {
		return data as SysRole[];
	}
	if (!data || typeof data !== "object") {
		return [];
	}
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.rows)) {
		return record.rows as SysRole[];
	}
	if (Array.isArray(record.list)) {
		return record.list as SysRole[];
	}
	if (Array.isArray(record.data)) {
		return record.data as SysRole[];
	}
	return [];
}

/**
 * 角色实体 → 下拉/多选选项。
 *
 * @param {SysRole} - 后端角色实体。
 * @returns {SelectOption | null} - 选项，无效实体时为 null。
 */
function sysRoleToSelectOption(role: SysRole): SelectOption | null {
	const value = role.roleId;
	const label = role.roleName?.trim();
	if (value === undefined || value === null || !label) {
		return null;
	}
	return { value: String(value), label };
}

/**
 * 加载并缓存角色名称映射。
 *
 * @returns {Record<string, string>} - 角色 ID 到名称的映射。
 */
async function getRoleNameMap(): Promise<Record<string, string>> {
	if (roleNameMapCache) return roleNameMapCache;

	const data = await fetchRoleListApi({
		pageNum: 1,
		pageSize: 200,
	});

	roleNameMapCache = Object.fromEntries(
		parseRoleRows(data)
			.map((role) => {
				const option = sysRoleToSelectOption(role);
				return option ? [option.value, option.label] : null;
			})
			.filter((item): item is [string, string] => item !== null),
	);

	return roleNameMapCache;
}

/**
 * 将列表行转为前端用户（角色仅从 list 响应解析，不调详情）。
 *
 * 若 list 仅带 roleIds、无名称，则拉一次角色列表做 ID→名称映射。
 *
 * @param {SysUser[]} - 列表接口原始行。
 * @returns {User[]} - 前端用户列表。
 */
async function mapListUsers(rows: SysUser[]): Promise<User[]> {
	const users = rows.map((row) => sysUserToUser(row, [], {}));

	const needsRoleNameMap = users.some(
		(user) => !user.roleNames && user.roleIds.length > 0,
	);
	if (!needsRoleNameMap) {
		return users;
	}

	const roleNameMap = await getRoleNameMap();
	return users.map((user) =>
		!user.roleNames && user.roleIds.length > 0
			? { ...user, roleNames: buildRoleNames(user.roleIds, roleNameMap) }
			: user,
	);
}

/**
 * 获取用户列表（分页）。
 *
 * @param {UserListParams} - 列表查询参数。
 * @returns {UserListResult} - 分页用户列表。
 */
export async function fetchUserListResult(
	params: UserListParams,
): Promise<UserListResult> {
	const { pageNum, pageSize, username, name } = params;
	const nameKeyword = name?.trim();

	// 后端 list 接口未实现 nickName 筛选，有姓名条件时拉全量后客户端过滤再分页
	if (nameKeyword) {
		const data = await fetchUserListApi(
			toUserListQuery({
				pageNum: 1,
				pageSize: MAX_FETCH_PAGE_SIZE,
				username,
			}),
		);
		const { rows } = parseUserListResponse(data);
		const filtered = filterSysUsersByName(rows, nameKeyword);
		const { pageRows, total } = paginateSysUsers(
			filtered,
			pageNum,
			pageSize,
		);

		return {
			list: await mapListUsers(pageRows),
			total,
			pageNum,
			pageSize,
		};
	}

	const data = await fetchUserListApi(toUserListQuery(params));
	const { rows, total } = parseUserListResponse(data);

	return {
		list: await mapListUsers(rows),
		total,
		pageNum,
		pageSize,
	};
}

/**
 * 获取部门树（新增/编辑表单）。
 *
 * @returns {DeptTreeNode[]} - 部门树节点列表。
 */
export async function getDeptTree(): Promise<DeptTreeNode[]> {
	const data = await fetchDeptTreeApi();
	return data ?? [];
}

/**
 * 获取角色选项（新增/编辑表单）。
 *
 * @returns {SelectOption[]} - 角色下拉选项。
 */
export async function getRoleOptions(): Promise<SelectOption[]> {
	const data = await fetchRoleListApi({
		pageNum: 1,
		pageSize: 200,
	});

	return parseRoleRows(data)
		.map(sysRoleToSelectOption)
		.filter((item): item is SelectOption => item !== null);
}
