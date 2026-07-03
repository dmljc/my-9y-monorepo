import type { RolePermissionModule, SysRole } from "./interface";

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
						title: permission.permName ?? "",
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
 * @returns {string[]} - 已勾选的页面/按钮权限 key 列表。
 */
export function extractCheckedKeys(
	modules: RolePermissionModule[] = [],
): string[] {
	const checkedKeys: string[] = [];
	for (const module of modules) {
		for (const subModule of module.subModules ?? []) {
			if (subModule.checked && subModule.subModuleId !== undefined) {
				checkedKeys.push(String(subModule.subModuleId));
			}
			for (const permission of subModule.permissions ?? []) {
				if (
					permission.checked &&
					permission.menuId !== undefined &&
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
 * @returns {Record<string, number[]>} - 页面 key 到隐藏 menuId 列表的映射。
 */
export function hiddenIdsByPage(
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
						permission.checked &&
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
