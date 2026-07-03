/**
 * 后端组织（部门）实体。
 */
export interface SysDept {
	deptId?: number;
	parentId?: number;
	deptName?: string;
	orderNum?: number;
	leader?: string;
	phone?: string;
	email?: string;
	status?: string;
	remark?: string;
	ancestors?: string;
	parentName?: string;
	children?: SysDept[];
	createBy?: string;
	createTime?: string;
	updateBy?: string;
	updateTime?: string;
	delFlag?: string;
}

/**
 * 组织列表查询参数。
 */
export interface DeptListQuery {
	deptName?: string;
	status?: string;
}

/**
 * 组织列表响应。
 */
export interface DeptListResponse {
	code: number;
	msg?: string;
	data: SysDept[];
}

/**
 * RuoYi 通用操作响应。
 */
export interface AjaxResult {
	code: number;
	msg?: string;
}
