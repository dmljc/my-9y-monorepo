import type { SysRole } from "./interface";

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
