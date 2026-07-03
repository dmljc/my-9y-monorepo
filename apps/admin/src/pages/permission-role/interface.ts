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

/** 角色列表响应（兼容 rows / list） */
export interface RoleListResponse {
	total: number;
	rows?: SysRole[];
	list?: SysRole[];
}

/** 角色菜单树响应（权限分配回显） */
export interface RoleMenuTreeselectResponse {
	code?: number;
	menus?: unknown[];
	checkedKeys?: (number | string)[];
}

/** 更新角色权限请求体（menuIds 提交至 PUT /system/role） */
export interface RolePermissionPayload {
	menuIds: number[];
}

/**
 * RuoYi 通用操作响应。
 */
export interface AjaxResult {
	code: number;
	msg?: string;
}
