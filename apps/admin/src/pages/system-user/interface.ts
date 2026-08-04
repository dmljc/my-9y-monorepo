/**
 * 后端部门信息。
 */
export interface SysDept {
	deptId?: number;
	deptName?: string;
	parentId?: number;
}

/**
 * 后端角色信息。
 */
export interface SysRole {
	roleId?: number;
	roleName?: string;
	roleKey?: string;
}

/**
 * 后端用户实体。
 */
export interface SysUser {
	userId?: number;
	userName?: string;
	nickName?: string;
	password?: string;
	deptId?: number;
	dept?: SysDept;
	/** 列表接口可能直接返回部门名称 */
	deptName?: string;
	roleIds?: number[] | string;
	/** 列表/详情接口可能返回单个角色 ID */
	roleId?: number;
	/** 列表/详情接口可能直接返回角色名称 */
	roleName?: string;
	/** 列表接口可能直接返回逗号分隔的角色名称 */
	roleNames?: string;
	roles?: SysRole[];
	status?: string;
	createTime?: string;
	remark?: string;
}

/**
 * 用户列表查询参数。
 */
export interface UserListQuery {
	pageNum: number;
	pageSize: number;
	userName?: string;
	nickName?: string;
}

/**
 * 用户列表响应。
 */
export interface UserListResponse {
	total: number;
	rows: SysUser[];
}

/**
 * 用户详情响应。
 */
export interface UserDetailResponse {
	code: number;
	msg?: string;
	roleIds?: number[];
	data: SysUser;
}

/**
 * 部门树节点。
 */
export interface DeptTreeNode {
	id: number;
	label: string;
	disabled?: boolean;
	children?: DeptTreeNode[];
}

/**
 * 部门树响应。
 */
export interface DeptTreeResponse {
	code: number;
	msg?: string;
	data: DeptTreeNode[];
}

/**
 * 角色列表响应。
 */
export interface RoleListResponse {
	total: number;
	rows: SysRole[];
}

/**
 * RuoYi 通用操作响应。
 */
export interface AjaxResult {
	code: number;
	msg?: string;
}
