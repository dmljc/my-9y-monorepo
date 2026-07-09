/** 警告列表 - 按钮权限码。 */
export const PERM_WARNING_LIST = {
	VIEW_DATA: "warning:list:view-data",
	RESOLVE: "warning:list:resolve",
} as const;

/** 警告规则 - 按钮权限码。 */
export const PERM_WARNING_RULES = {
	CREATE: "warning:rules:create",
	EDIT: "warning:rules:edit",
	DELETE: "warning:rules:delete",
} as const;

/** 报警等级管理 - 按钮权限码。 */
export const PERM_WARNING_LEVELS = {
	CREATE: "warning:levels:create",
	EDIT: "warning:levels:edit",
	DELETE: "warning:levels:delete",
} as const;

/** 点检台账 - 按钮权限码。 */
export const PERM_INSPECTION_LEDGER = {
	CREATE: "device:inspection-ledger:create",
	EDIT: "device:inspection-ledger:edit",
	INSPECT: "device:inspection-ledger:inspect",
	DELETE: "device:inspection-ledger:delete",
} as const;

/** 物模型数据 - 按钮权限码（SYNC 对应「同步」，前端暂无该按钮）。 */
export const PERM_MODEL_DATA = {
	SYNC: "model-data:sync",
	DELETE: "model-data:delete",
} as const;

/** 设备反控 - 按钮权限码（LIST/QUERY 对应查看类权限，前端暂无独立按钮）。 */
export const PERM_REVERSE_CONTROL = {
	LIST: "iiot:deviceControl:list",
	QUERY: "iiot:deviceControl:query",
	ADD: "iiot:deviceControl:add",
	EDIT: "iiot:deviceControl:edit",
	REMOVE: "iiot:deviceControl:remove",
} as const;

/** 角色管理 - 按钮权限码（EDIT 同时对应「编辑」与「权限分配」按钮）。 */
export const PERM_ROLE = {
	ADD: "system:role:add",
	EDIT: "system:role:edit",
	REMOVE: "system:role:remove",
} as const;

/** 用户管理 - 按钮权限码。 */
export const PERM_USER = {
	ADD: "system:user:add",
	EDIT: "system:user:edit",
	REMOVE: "system:user:remove",
	EXPORT: "system:user:export",
} as const;

/** 组织管理 - 按钮权限码。 */
export const PERM_ORGANIZATION = {
	ADD: "system:dept:add",
	EDIT: "system:dept:edit",
	REMOVE: "system:dept:remove",
} as const;

/** 操作日志 - 按钮权限码。 */
export const PERM_OPERATION_LOG = {
	EXPORT: "permission:operation-log:export",
} as const;
