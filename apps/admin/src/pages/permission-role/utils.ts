import type {
	RolePermissionDetailResponse,
	RolePermissionItem,
	RolePermissionModule,
	SysRole,
} from "./interface";

/** 按钮级权限 */
export interface AssignAction {
	key: string;
	title: string;
}

/** 权限分配表格行 */
export interface AssignRow {
	rowKey: string;
	moduleKey: string;
	moduleTitle: string;
	moduleRowSpan: number;
	pageKey: string;
	pageTitle: string;
	actions: AssignAction[];
}

/** 新增/编辑角色表单值 */
export interface RoleFormValues {
	roleName: string;
	remark: string;
}

/**
 * 将按钮权限名称规范为简短动词（通用 CRUD 不与页面列重复宾语）。
 *
 * @param {string} - 后端 permName。
 * @returns {string} - 展示用按钮文案。
 */
export function formatActionTitle(permName: string): string {
	if (
		permName.startsWith("新增") ||
		permName.startsWith("添加") ||
		permName.startsWith("创建")
	) {
		return "新增";
	}
	if (permName.startsWith("编辑") && permName.length > 2) {
		return "编辑";
	}
	if (permName.startsWith("删除") && permName.length > 2) {
		return "删除";
	}
	if (permName.startsWith("导出") && permName.length > 2) {
		return "导出";
	}
	return permName;
}

/** 超级管理员角色编码（与后端 roleKey 一致） */
export const SUPER_ADMIN_ROLE_CODE = "admin";

/** 角色名称最大字符数 */
export const ROLE_NAME_MAX_LENGTH = 20;

/** 角色描述最大字符数 */
export const ROLE_DESCRIPTION_MAX_LENGTH = 100;

/**
 * 判断按钮权限是否不在分配弹窗中展示（查询/重置类筛选项）。
 *
 * @param {string} - 权限名称。
 * @param {string} - 权限标识。
 * @returns {boolean} - 是否隐藏。
 */
function isHiddenAction(permName?: string, perms?: string): boolean {
	if (perms?.endsWith(":query") || permName?.endsWith("查询")) {
		return true;
	}
	if (perms?.endsWith(":reset") || permName === "重置") {
		return true;
	}
	return false;
}

/**
 * 判断后端 checked/selected 是否为真（兼容 1、"1"、"true"）。
 *
 * @param {unknown} - 后端 checked 或 selected 字段。
 * @returns {boolean} - 是否视为已勾选。
 */
function isTruthyChecked(value: unknown): boolean {
	if (value === true || value === 1) return true;
	if (value === "true" || value === "1") return true;
	return false;
}

/**
 * 从对象中解析已分配 menuId 列表。
 *
 * @param {Record<string, unknown>} - 含 menuIds 等字段的对象。
 * @returns {number[]} - 去重后的 menuId 列表。
 */
function pickAssignedMenuIds(source: Record<string, unknown>): number[] {
	const raw =
		source.menuIds ?? source.assignedMenuIds ?? source.checkedMenuIds;
	if (!Array.isArray(raw)) return [];
	return [
		...new Set(
			raw.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
		),
	];
}

/**
 * 解析权限分配详情响应，兼容未解包的 envelope 与仅返回 menuIds 的后端。
 *
 * @param {RolePermissionDetailResponse | unknown} - getAssignDetail 返回值。
 * @param {(number | string)[]} - 列表行上的 menuIds 兜底。
 * @returns {{ modules: RolePermissionModule[]; assignedMenuIds: number[] }} - 模块树与已分配 menuId。
 */
export function parseAssignDetailResponse(
	res: RolePermissionDetailResponse | unknown,
	roleMenuIds: (number | string)[] = [],
): { modules: RolePermissionModule[]; assignedMenuIds: number[] } {
	const empty = {
		modules: [] as RolePermissionModule[],
		assignedMenuIds: [] as number[],
	};
	if (res == null || typeof res !== "object") return empty;

	const root = res as Record<string, unknown>;
	let modules: RolePermissionModule[] = [];
	let assignedMenuIds: number[] = [];

	if (Array.isArray(root.modules)) {
		modules = root.modules as RolePermissionModule[];
		assignedMenuIds = pickAssignedMenuIds(root);
	} else if (root.data != null && typeof root.data === "object") {
		const data = root.data as Record<string, unknown>;
		if (Array.isArray(data.modules)) {
			modules = data.modules as RolePermissionModule[];
			assignedMenuIds = pickAssignedMenuIds(data);
		}
	}

	if (assignedMenuIds.length === 0) {
		assignedMenuIds = pickAssignedMenuIds({ menuIds: roleMenuIds });
	}

	return { modules, assignedMenuIds };
}

/**
 * 判断权限项是否已分配（树节点 checked 或 menuIds 列表命中）。
 *
 * @param {RolePermissionItem} - 按钮权限项。
 * @param {Set<string>} - 已分配 menuId 集合。
 * @returns {boolean} - 是否已分配。
 */
function isPermissionAssigned(
	permission: RolePermissionItem,
	assigned: Set<string>,
): boolean {
	if (permission.menuId === undefined) return false;
	const selected = (permission as { selected?: unknown }).selected;
	return (
		isTruthyChecked(permission.checked) ||
		isTruthyChecked(selected) ||
		assigned.has(String(permission.menuId))
	);
}

/**
 * 判断页面（子模块）是否已分配。
 *
 * @param {number | undefined} - 子模块 menuId。
 * @param {unknown} - subModule.checked。
 * @param {unknown} - subModule.selected。
 * @param {boolean} - 是否有已分配的子按钮。
 * @param {Set<string>} - 已分配 menuId 集合。
 * @returns {boolean} - 是否已分配。
 */
function isPageAssigned(
	subModuleId: number | undefined,
	checked: unknown,
	selected: unknown,
	hasAssignedPermission: boolean,
	assigned: Set<string>,
): boolean {
	if (subModuleId === undefined) return false;
	return (
		isTruthyChecked(checked) ||
		isTruthyChecked(selected) ||
		assigned.has(String(subModuleId)) ||
		hasAssignedPermission
	);
}

/**
 * 将权限分配详情展开为表格行。
 *
 * @param {RolePermissionModule[]} - 权限模块列表。
 * @returns {AssignRow[]} - 表格行数据。
 */
export function buildAssignRows(
	modules: RolePermissionModule[] = [],
): AssignRow[] {
	const rows: AssignRow[] = [];
	for (const module of modules) {
		const subModules = module.subModules ?? [];
		subModules.forEach((subModule, index) => {
			rows.push({
				rowKey: String(subModule.subModuleId),
				moduleKey: String(module.moduleId),
				moduleTitle: module.moduleName ?? "",
				moduleRowSpan: index === 0 ? subModules.length : 0,
				pageKey: String(subModule.subModuleId),
				pageTitle: subModule.subModuleName ?? "",
				actions: (subModule.permissions ?? [])
					.filter(
						(permission) =>
							!isHiddenAction(
								permission.permName,
								permission.perms,
							),
					)
					.map((permission) => ({
						key: String(permission.menuId),
						title: formatActionTitle(permission.permName ?? ""),
					})),
			});
		});
	}
	return rows;
}

/**
 * 提取可见项的已勾选 key（不含隐藏的查询/重置按钮）。
 *
 * @param {RolePermissionModule[]} - 权限模块列表。
 * @param {number[]} - 已分配 menuId 列表（树节点 checked 未更新时的兜底）。
 * @returns {string[]} - 已勾选的页面/按钮权限 key 列表。
 */
export function extractCheckedKeys(
	modules: RolePermissionModule[] = [],
	assignedMenuIds: number[] = [],
): string[] {
	const assigned = new Set(assignedMenuIds.map(String));
	const checkedKeys: string[] = [];
	for (const module of modules) {
		for (const subModule of module.subModules ?? []) {
			if (subModule.subModuleId === undefined) continue;
			const pageKey = String(subModule.subModuleId);
			const permissions = subModule.permissions ?? [];
			const subSelected = (subModule as { selected?: unknown }).selected;
			const hasAssignedPermission = permissions.some((permission) =>
				isPermissionAssigned(permission, assigned),
			);

			if (
				isPageAssigned(
					subModule.subModuleId,
					subModule.checked,
					subSelected,
					hasAssignedPermission,
					assigned,
				)
			) {
				checkedKeys.push(pageKey);
			}

			for (const permission of permissions) {
				if (
					isPermissionAssigned(permission, assigned) &&
					!isHiddenAction(permission.permName, permission.perms)
				) {
					checkedKeys.push(String(permission.menuId));
				}
			}
		}
	}
	return checkedKeys;
}

/**
 * 按页面 key 收集已勾选但隐藏的按钮 menuId。
 *
 * @param {RolePermissionModule[]} - 权限模块列表。
 * @param {number[]} - 已分配 menuId 列表（树节点 checked 未更新时的兜底）。
 * @returns {Record<string, number[]>} - 页面 key 到隐藏 menuId 列表的映射。
 */
export function hiddenIdsByPage(
	modules: RolePermissionModule[] = [],
	assignedMenuIds: number[] = [],
): Record<string, number[]> {
	const assigned = new Set(assignedMenuIds.map(String));
	const map: Record<string, number[]> = {};
	for (const module of modules) {
		for (const subModule of module.subModules ?? []) {
			if (subModule.subModuleId === undefined) continue;
			const pageKey = String(subModule.subModuleId);
			const hiddenIds = (subModule.permissions ?? [])
				.filter(
					(permission) =>
						isPermissionAssigned(permission, assigned) &&
						permission.menuId !== undefined &&
						isHiddenAction(permission.permName, permission.perms),
				)
				.map((permission) => permission.menuId as number);
			if (hiddenIds.length > 0) {
				map[pageKey] = hiddenIds;
			}
		}
	}
	return map;
}

/**
 * 收集各页面下全部隐藏按钮 menuId（用于勾选页面时自动附带查询/重置权限）。
 *
 * @param {RolePermissionModule[]} - 权限模块列表。
 * @returns {Record<string, number[]>} - 页面 key 到隐藏 menuId 列表的映射。
 */
export function buildAllHiddenIdsByPage(
	modules: RolePermissionModule[] = [],
): Record<string, number[]> {
	const map: Record<string, number[]> = {};
	for (const module of modules) {
		for (const subModule of module.subModules ?? []) {
			if (subModule.subModuleId === undefined) continue;
			const pageKey = String(subModule.subModuleId);
			const hiddenIds = (subModule.permissions ?? [])
				.filter(
					(permission) =>
						permission.menuId !== undefined &&
						isHiddenAction(permission.permName, permission.perms),
				)
				.map((permission) => permission.menuId as number);
			if (hiddenIds.length > 0) {
				map[pageKey] = hiddenIds;
			}
		}
	}
	return map;
}

/**
 * 根据可见勾选与隐藏 menuId 映射收集可提交的 menuId 列表。
 *
 * @param {string[]} - 已勾选的可见权限 key 列表。
 * @param {AssignRow[]} - 权限表格行。
 * @param {Record<string, number[]>} - 各页面下隐藏但需保留的 menuId。
 * @returns {number[]} - 去重后的 menuId 列表。
 */
export function collectMenuIds(
	checkedKeys: string[],
	rows: AssignRow[],
	hiddenMenuIdsByPage: Record<string, number[]> = {},
): number[] {
	const validKeys = new Set<string>();
	for (const row of rows) {
		validKeys.add(row.pageKey);
		for (const action of row.actions) {
			validKeys.add(action.key);
		}
	}

	const visibleMenuIds = checkedKeys
		.filter((key) => validKeys.has(key))
		.map(Number)
		.filter((id) => !Number.isNaN(id));

	const hiddenMenuIds = Object.entries(hiddenMenuIdsByPage)
		.filter(([pageKey]) => checkedKeys.includes(pageKey))
		.flatMap(([, ids]) => ids);

	return [...new Set([...visibleMenuIds, ...hiddenMenuIds])];
}

/**
 * 获取页面下全部可见按钮权限 key。
 *
 * @param {string} - 页面权限 key。
 * @param {AssignRow[]} - 权限表格行。
 * @returns {string[]} - 按钮权限 key 列表。
 */
export function getActionKeys(pageKey: string, rows: AssignRow[]): string[] {
	const row = rows.find((item) => item.pageKey === pageKey);
	return row?.actions.map((action) => action.key) ?? [];
}

/**
 * 格式化权限数量展示文案。
 *
 * @param {SysRole} - 后端角色实体。
 * @returns {string} - 权限数量展示文案。
 */
export function formatPermissionCount(role: SysRole): string {
	if (role.admin || role.roleKey === SUPER_ADMIN_ROLE_CODE) {
		return "所有";
	}
	return String(role.menuCount ?? 0);
}

/**
 * 判断角色名称是否重复。
 *
 * @param {SysRole[]} - 已有角色列表。
 * @param {string} - 待校验的角色名称。
 * @param {number} - 编辑时排除的角色 ID。
 * @returns {boolean} - 是否重复。
 */
export function isDuplicateRoleName(
	roles: SysRole[],
	name: string,
	excludeId?: number,
): boolean {
	return roles.some(
		(item) =>
			item.roleName === name &&
			(excludeId === undefined || item.roleId !== excludeId),
	);
}
