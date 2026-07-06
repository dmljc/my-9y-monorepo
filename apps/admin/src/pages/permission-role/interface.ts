/**
 * 后端角色实体。
 */
export interface SysRole {
	roleId?: number;
	roleName?: string;
	roleKey?: string;
	remark?: string;
	createTime?: string;
	menuIds?: (number | string)[];
	/** 列表/详情接口返回的已分配菜单数量 */
	menuCount?: number;
	userCount?: number;
	/** 是否为超级管理员角色 */
	admin?: boolean;
}

/** 角色列表查询参数 */
export interface RoleListQuery {
	pageNum: number;
	pageSize: number;
	roleName?: string;
}

/** 角色列表响应 */
export interface RoleListResponse {
	total: number;
	list: SysRole[];
}

/** 角色权限明细项（按钮级） */
export interface RolePermissionItem {
	menuId?: number;
	permName?: string;
	perms?: string;
	checked?: boolean;
}

/** 角色权限子模块（页面级） */
export interface RolePermissionSubModule {
	subModuleId?: number;
	subModuleName?: string;
	orderNum?: number;
	checked?: boolean;
	permissions?: RolePermissionItem[];
}

/** 角色权限模块 */
export interface RolePermissionModule {
	moduleId?: number;
	moduleName?: string;
	orderNum?: number;
	checked?: boolean;
	subModules?: RolePermissionSubModule[];
	directPermissions?: RolePermissionItem[] | null;
}

/** 角色权限分配详情响应（request 解包后为 data 层） */
export interface RolePermissionDetailResponse {
	code?: number;
	totalAssigned?: number;
	modules?: RolePermissionModule[];
	/** 已分配的 menuId 列表（部分后端不在树节点上写 checked，仅返回此字段） */
	menuIds?: (number | string)[];
	assignedMenuIds?: (number | string)[];
	checkedMenuIds?: (number | string)[];
	data?:
		| RolePermissionModule[]
		| {
				totalAssigned?: number;
				modules?: RolePermissionModule[];
				menuIds?: (number | string)[];
				assignedMenuIds?: (number | string)[];
				checkedMenuIds?: (number | string)[];
		  };
}

/** 更新角色权限请求体 */
export interface RolePermissionPayload {
	roleId: number;
	menuIds: number[];
}

/**
 * RuoYi 通用操作响应。
 */
export interface AjaxResult {
	code: number;
	msg?: string;
}
