import dayjs from "dayjs";
import {
	create as createRoleApi,
	detail as fetchRoleDetailApi,
	list as fetchRoleListApi,
	getRoleMenuTreeselect as fetchRoleMenuTreeselectApi,
	remove as removeRoleApi,
	update as updateRoleApi,
	updatePermissions as updateRolePermissionsApi,
} from "./api";
import type {
	RoleListQuery,
	RoleMenuTreeselectResponse,
	SysRole,
} from "./interface";

/** 按钮级权限 */
export interface PermissionAction {
	key: string;
	title: string;
}

/** 页面权限 */
export interface PermissionPage {
	key: string;
	title: string;
	actions: PermissionAction[];
}

/** 功能模块 */
export interface PermissionModule {
	key: string;
	title: string;
	pages: PermissionPage[];
}

/** 权限分配表格行 */
export interface PermissionTableRow {
	rowKey: string;
	moduleKey: string;
	moduleTitle: string;
	moduleRowSpan: number;
	pageKey: string;
	pageTitle: string;
	actions: PermissionAction[];
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

/** 超级管理员角色编码（与后端 roleKey 一致） */
export const SUPER_ADMIN_ROLE_CODE = "admin";

/** 角色名称最大字符数 */
export const ROLE_NAME_MAX_LENGTH = 20;

/** 角色描述最大字符数 */
export const ROLE_DESCRIPTION_MAX_LENGTH = 100;

/** 权限模块 mock 数据，对接后端后替换 */
export const ROLE_PERMISSION_MODULES: PermissionModule[] = [
	{
		key: "dashboard",
		title: "大屏",
		pages: [
			{
				key: "dashboard",
				title: "大屏",
				actions: [{ key: "dashboard:view", title: "查看大屏" }],
			},
		],
	},
	{
		key: "statistics",
		title: "统计分析",
		pages: [
			{
				key: "statistics",
				title: "统计分析",
				actions: [],
			},
		],
	},
	{
		key: "warning",
		title: "警告管理",
		pages: [
			{
				key: "warning:list",
				title: "警告列表",
				actions: [
					{
						key: "warning:list:view-data",
						title: "查看前后15分钟数据",
					},
					{ key: "warning:list:resolve", title: "标记解决" },
				],
			},
			{
				key: "warning:rules",
				title: "警告规则",
				actions: [
					{ key: "warning:rules:create", title: "新增规则" },
					{ key: "warning:rules:edit", title: "编辑规则" },
					{ key: "warning:rules:delete", title: "删除规则" },
				],
			},
			{
				key: "warning:levels",
				title: "报警等级管理",
				actions: [
					{ key: "warning:levels:create", title: "新增等级" },
					{ key: "warning:levels:edit", title: "编辑" },
					{ key: "warning:levels:delete", title: "删除" },
				],
			},
		],
	},
	{
		key: "device",
		title: "设备管理",
		pages: [
			{
				key: "device:inspection-ledger",
				title: "点检台账",
				actions: [
					{
						key: "device:inspection-ledger:create",
						title: "新增台账",
					},
					{
						key: "device:inspection-ledger:inspect",
						title: "执行点检",
					},
					{
						key: "device:inspection-ledger:delete",
						title: "删除台账",
					},
				],
			},
		],
	},
	{
		key: "historical-data",
		title: "历史数据",
		pages: [
			{
				key: "historical-data",
				title: "历史数据",
				actions: [],
			},
		],
	},
	{
		key: "model-data",
		title: "物模型数据",
		pages: [
			{
				key: "model-data",
				title: "物模型数据",
				actions: [
					{ key: "model-data:sync", title: "同步" },
					{ key: "model-data:delete", title: "删除" },
				],
			},
		],
	},
	{
		key: "reverse-control",
		title: "设备反控",
		pages: [
			{
				key: "reverse-control",
				title: "设备反控",
				actions: [
					{ key: "reverse-control:create", title: "新增反控规则" },
					{ key: "reverse-control:edit", title: "编辑" },
					{ key: "reverse-control:delete", title: "删除" },
				],
			},
		],
	},
	{
		key: "permission",
		title: "角色权限",
		pages: [
			{
				key: "permission:role",
				title: "角色管理",
				actions: [
					{ key: "permission:role:create", title: "新增角色" },
					{ key: "permission:role:assign", title: "权限分配" },
					{ key: "permission:role:delete", title: "删除角色" },
				],
			},
			{
				key: "permission:user",
				title: "用户管理",
				actions: [
					{ key: "permission:user:create", title: "新增用户" },
					{ key: "permission:user:edit", title: "编辑用户" },
					{ key: "permission:user:delete", title: "删除用户" },
					{ key: "permission:user:export", title: "导出用户" },
				],
			},
			{
				key: "permission:organization",
				title: "组织管理",
				actions: [
					{
						key: "permission:organization:create",
						title: "添加组织",
					},
					{
						key: "permission:organization:edit",
						title: "编辑组织",
					},
					{
						key: "permission:organization:delete",
						title: "删除组织",
					},
				],
			},
		],
	},
];

/** 平板端权限 mock 数据，对接后端后替换 */
export const TABLET_PERMISSION_MODULES: PermissionModule[] = [
	{
		key: "tablet:device-control",
		title: "设备控制",
		pages: [
			{
				key: "tablet:device-control",
				title: "设备控制",
				actions: [
					{
						key: "tablet:device-control:main-switch",
						title: "总控开关",
					},
					{
						key: "tablet:device-control:device-switch",
						title: "设备开关",
					},
					{
						key: "tablet:device-control:clean-switch",
						title: "清洗开关",
					},
				],
			},
		],
	},
	{
		key: "tablet:sampling-config",
		title: "取样配置",
		pages: [
			{
				key: "tablet:sampling-config",
				title: "取样配置",
				actions: [
					{ key: "tablet:sampling-config:edit", title: "编辑" },
				],
			},
		],
	},
	{
		key: "tablet:pipeline-config",
		title: "管道配置",
		pages: [
			{
				key: "tablet:pipeline-config:basic",
				title: "管道配置",
				actions: [
					{ key: "tablet:pipeline-config:edit", title: "编辑" },
				],
			},
			{
				key: "tablet:pipeline-config:manage",
				title: "管道维护",
				actions: [
					{ key: "tablet:pipeline-config:create", title: "新增" },
					{ key: "tablet:pipeline-config:update", title: "编辑" },
					{ key: "tablet:pipeline-config:delete", title: "删除" },
				],
			},
		],
	},
];

/** 角色列表查询参数（页面层） */
export interface RoleListParams {
	pageNum: number;
	pageSize: number;
	name?: string;
}

/** 角色列表结果（页面层） */
export interface RoleListResult {
	list: Role[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/**
 * 从权限模块树收集全部权限 key。
 *
 * @param {PermissionModule[]} - 权限模块列表。
 * @returns {string[]} - 权限 key 列表。
 */
function collectPermissionIdsFromModules(
	modules: PermissionModule[],
): string[] {
	const ids: string[] = [];
	for (const module of modules) {
		for (const page of module.pages) {
			ids.push(page.key);
			for (const action of page.actions) {
				ids.push(action.key);
			}
		}
	}
	return ids;
}

/**
 * 按页面 key 查找权限页面定义。
 *
 * @param {string} - 页面权限 key。
 * @returns {PermissionPage | undefined} - 匹配的页面定义。
 */
function findPermissionPage(pageKey: string): PermissionPage | undefined {
	for (const modules of [
		ROLE_PERMISSION_MODULES,
		TABLET_PERMISSION_MODULES,
	]) {
		for (const module of modules) {
			const page = module.pages.find((item) => item.key === pageKey);
			if (page) {
				return page;
			}
		}
	}
	return undefined;
}

/**
 * 将权限模块展开为表格行（含模块列 rowSpan）。
 *
 * @param {PermissionModule[]} - 权限模块列表。
 * @returns {PermissionTableRow[]} - 表格行数据。
 */
export function buildPermissionTableRows(
	modules: PermissionModule[] = ROLE_PERMISSION_MODULES,
): PermissionTableRow[] {
	const rows: PermissionTableRow[] = [];
	for (const module of modules) {
		module.pages.forEach((page, index) => {
			rows.push({
				rowKey: page.key,
				moduleKey: module.key,
				moduleTitle: module.title,
				moduleRowSpan: index === 0 ? module.pages.length : 0,
				pageKey: page.key,
				pageTitle: page.title,
				actions: page.actions,
			});
		});
	}
	return rows;
}

/**
 * 获取页面下全部按钮权限 key。
 *
 * @param {string} - 页面权限 key。
 * @returns {string[]} - 按钮权限 key 列表。
 */
export function getPageActionKeys(pageKey: string): string[] {
	return (
		findPermissionPage(pageKey)?.actions.map((action) => action.key) ?? []
	);
}

/**
 * 获取全部可分配的权限 key（页面 + 按钮）。
 *
 * @returns {string[]} - 可分配权限 key 列表。
 */
export function getAllAssignablePermissionIds(): string[] {
	return [
		...collectPermissionIdsFromModules(ROLE_PERMISSION_MODULES),
		...collectPermissionIdsFromModules(TABLET_PERMISSION_MODULES),
	];
}

/**
 * 前端列表参数 → 后端查询参数。
 *
 * @param {RoleListParams} - 前端列表查询参数。
 * @returns {RoleListQuery} - 后端查询参数。
 */
function toRoleListQuery(params: RoleListParams): RoleListQuery {
	const { pageNum, pageSize, name } = params;
	return {
		pageNum,
		pageSize,
		roleName: name?.trim() || undefined,
	};
}

/**
 * 从角色列表接口响应中解析 rows 与 total。
 *
 * @param {unknown} - 角色列表接口原始响应。
 * @returns {{ rows: SysRole[]; total: number }} - 列表数据与总数。
 */
function parseRoleListResponse(data: unknown): {
	rows: SysRole[];
	total: number;
} {
	if (Array.isArray(data)) {
		return { rows: data as SysRole[], total: data.length };
	}
	if (!data || typeof data !== "object") {
		return { rows: [], total: 0 };
	}

	const record = data as Record<string, unknown>;

	if (Array.isArray(record.rows)) {
		return {
			rows: record.rows as SysRole[],
			total:
				typeof record.total === "number"
					? record.total
					: record.rows.length,
		};
	}

	if (Array.isArray(record.list)) {
		return {
			rows: record.list as SysRole[],
			total:
				typeof record.total === "number"
					? record.total
					: record.list.length,
		};
	}

	if (Array.isArray(record.data)) {
		return {
			rows: record.data as SysRole[],
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
		return parseRoleListResponse(record.data);
	}

	return { rows: [], total: 0 };
}

/**
 * 判断后端角色是否为超级管理员。
 *
 * @param {SysRole} - 后端角色实体。
 * @returns {boolean} - 是否为超级管理员。
 */
function isAdminRole(sysRole: SysRole): boolean {
	return sysRole.admin === true || sysRole.roleKey === SUPER_ADMIN_ROLE_CODE;
}

/**
 * 后端角色实体 → 前端列表行数据。
 *
 * @param {SysRole} - 后端角色实体。
 * @param {string[]} - 权限 ID 列表（详情接口补充）。
 * @returns {Role} - 前端角色数据。
 */
function sysRoleToRole(sysRole: SysRole, permissionIds: string[] = []): Role {
	const menuIds = (sysRole.menuIds ?? []).map(String);
	const resolvedPermissionIds =
		permissionIds.length > 0 ? permissionIds : menuIds;
	const admin = isAdminRole(sysRole);

	return {
		id: String(sysRole.roleId ?? ""),
		name: sysRole.roleName ?? "",
		code: sysRole.roleKey ?? "",
		description: sysRole.remark ?? "",
		userCount: sysRole.userCount ?? 0,
		hasAllPermissions: admin,
		permissionCount: admin
			? 0
			: resolvedPermissionIds.length > 0
				? resolvedPermissionIds.length
				: (sysRole.menuCount ?? 0),
		permissionIds: resolvedPermissionIds,
		createdAt: sysRole.createTime ?? "",
	};
}

/**
 * 角色记录 → 表单初始值（编辑回填）。
 *
 * @param {Role} - 角色列表行数据。
 * @returns {RoleFormValues} - 表单初始值。
 */
export function recordToFormValues(record: Role): RoleFormValues {
	return {
		name: record.name,
		description: record.description,
	};
}

/**
 * 表单值 → 后端角色提交体。
 *
 * @param {RoleFormValues} - 新增/编辑角色表单值。
 * @param {string} - 编辑时的角色 ID，新增时省略。
 * @param {string} - 编辑时的角色编码（roleKey），新增时省略。
 * @returns {SysRole} - 后端角色提交体。
 */
function formValuesToSysRole(
	values: RoleFormValues,
	roleId?: string,
	roleKey?: string,
): SysRole {
	const payload: SysRole = {
		roleName: values.name.trim(),
		remark: values.description?.trim(),
	};

	if (roleId) {
		payload.roleId = Number(roleId);
	}
	if (roleKey) {
		payload.roleKey = roleKey;
	}

	return payload;
}

/**
 * 判断是否为系统内置角色。
 *
 * @param {Role} - 前端角色数据。
 * @returns {boolean} - 是否为系统内置角色。
 */
export function isSystemRole(role: Role): boolean {
	return role.hasAllPermissions || role.code === SUPER_ADMIN_ROLE_CODE;
}

/**
 * 格式化角色创建时间。
 *
 * @param {Role} - 前端角色数据。
 * @returns {string} - 格式化后的创建时间。
 */
export function formatRoleCreatedAt(role: Role): string {
	if (isSystemRole(role) || !role.createdAt) {
		return "-";
	}
	return dayjs(role.createdAt).format("YYYY-MM-DD");
}

/**
 * 格式化权限数量展示文案。
 *
 * @param {Role} - 前端角色数据。
 * @returns {string} - 权限数量展示文案。
 */
export function formatPermissionCount(role: Role): string {
	if (role.hasAllPermissions) {
		return "所有";
	}
	return String(role.permissionCount);
}

/**
 * 过滤并去重可分配的权限 ID。
 *
 * @param {string[]} - 已勾选的权限 key 列表。
 * @returns {string[]} - 合法且去重后的权限 ID 列表。
 */
export function normalizePermissionIds(checkedKeys: string[]): string[] {
	const valid = new Set(getAllAssignablePermissionIds());
	return [...new Set(checkedKeys.filter((key) => valid.has(key)))];
}

/**
 * 判断角色名称是否重复。
 *
 * @param {Role[]} - 已有角色列表。
 * @param {string} - 待校验的角色名称。
 * @param {string} - 编辑时排除的角色 ID。
 * @returns {boolean} - 是否重复。
 */
export function isDuplicateRoleName(
	roles: Role[],
	name: string,
	excludeId?: string,
): boolean {
	return roles.some(
		(item) => item.name === name && (!excludeId || item.id !== excludeId),
	);
}

/**
 * 获取角色列表（分页）。
 *
 * @param {RoleListParams} - 列表查询参数。
 * @returns {Promise<RoleListResult>} - 分页列表结果。
 */
export async function list(params: RoleListParams): Promise<RoleListResult> {
	const { pageNum, pageSize } = params;
	const data = await fetchRoleListApi(toRoleListQuery(params));
	const { rows, total } = parseRoleListResponse(data);

	return {
		list: rows.map((row) => sysRoleToRole(row)),
		total,
		pageNum,
		pageSize,
	};
}

/**
 * 获取角色已分配的菜单 ID（权限分配回显）。
 *
 * @param {string} - 角色 ID。
 * @returns {string[]} - 已勾选的菜单 ID 列表。
 */
export async function getRoleCheckedMenuIds(id: string): Promise<string[]> {
	const res: RoleMenuTreeselectResponse =
		await fetchRoleMenuTreeselectApi(id);
	if (res?.code !== undefined && res.code !== 200) {
		throw new Error("加载角色权限失败");
	}
	return (res.checkedKeys ?? []).map(String);
}

/**
 * 获取角色详情（权限分配回显）。
 *
 * @param {string} - 角色 ID。
 * @returns {Promise<Role>} - 角色详情。
 */
export async function detail(id: string): Promise<Role> {
	const sysRole: SysRole = await fetchRoleDetailApi(id);
	const permissionIds = await getRoleCheckedMenuIds(id);
	return sysRoleToRole(sysRole, permissionIds);
}

/**
 * 创建角色。
 *
 * @param {RoleFormValues} - 角色表单值。
 * @returns {Promise<void>} - 无返回值。
 */
export async function create(values: RoleFormValues): Promise<void> {
	await createRoleApi(formValuesToSysRole(values));
}

/**
 * 更新角色。
 *
 * @param {string} - 角色 ID。
 * @param {RoleFormValues} - 编辑表单值。
 * @param {string} - 角色编码（roleKey），编辑时传入以保留后端字段。
 * @returns {Promise<void>} - 无返回值。
 */
export async function update(
	id: string,
	values: RoleFormValues,
	roleKey?: string,
): Promise<void> {
	await updateRoleApi(formValuesToSysRole(values, id, roleKey));
}

/**
 * 更新角色权限。
 *
 * @param {string} - 角色 ID。
 * @param {string[]} - 权限 ID 列表。
 * @returns {Promise<void>} - 无返回值。
 */
export async function updatePermissions(
	id: string,
	permissionIds: string[],
): Promise<void> {
	const normalized = normalizePermissionIds(permissionIds);
	const menuIds = normalized.map(Number).filter((id) => !Number.isNaN(id));

	await updateRolePermissionsApi(id, { menuIds });
}

/**
 * 删除角色。
 *
 * @param {string} - 角色 ID。
 * @returns {Promise<void>} - 无返回值。
 */
export async function remove(id: string): Promise<void> {
	await removeRoleApi(id);
}
