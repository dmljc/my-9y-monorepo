/** 设备控制 - 按钮 / 厂房权限码。 */
export const PERM_DEVICE_CONTROL = {
	LIST: "iiot:tablet:deviceControl:list",
	SWITCH_DEVICE: "iiot:tablet:deviceControl:switchDevice",
	SWITCH_BUILDING: "iiot:tablet:deviceControl:switchBuilding",
	CLEAN: "iiot:tablet:deviceControl:clean",
	BUILDING_X03: "iiot:tablet:deviceControl:building:x03",
	BUILDING_X12: "iiot:tablet:deviceControl:building:x12",
} as const;

/** 设备台账（添加设备）- 按钮 / 厂房权限码。 */
export const PERM_LEDGER = {
	LIST: "iiot:tablet:ledger:list",
	ADD: "iiot:tablet:ledger:add",
	EDIT: "iiot:tablet:ledger:edit",
	ENABLE: "iiot:tablet:ledger:enable",
	DISABLE: "iiot:tablet:ledger:disable",
	REMOVE: "iiot:tablet:ledger:remove",
	BUILDING_X03: "iiot:tablet:ledger:building:x03",
	BUILDING_X12: "iiot:tablet:ledger:building:x12",
} as const;

/** 管道配置 - 按钮 / 厂房权限码。 */
export const PERM_PIPELINE = {
	LIST: "iiot:tablet:pipeline:list",
	SAVE_ROOM: "iiot:tablet:pipeline:saveRoom",
	BUILDING_X03: "iiot:tablet:pipeline:building:x03",
	BUILDING_X12: "iiot:tablet:pipeline:building:x12",
} as const;

/**
 * 厂房标签（如 X12 / X03）到权限码的映射表类型。
 */
export type BuildingPermMap = Record<string, string>;

/** 设备控制厂房权限映射（key 为 label 小写）。 */
export const DEVICE_CONTROL_BUILDING_PERMS: BuildingPermMap = {
	x03: PERM_DEVICE_CONTROL.BUILDING_X03,
	x12: PERM_DEVICE_CONTROL.BUILDING_X12,
};

/** 台账厂房权限映射。 */
export const LEDGER_BUILDING_PERMS: BuildingPermMap = {
	x03: PERM_LEDGER.BUILDING_X03,
	x12: PERM_LEDGER.BUILDING_X12,
};

/** 管道配置厂房权限映射。 */
export const PIPELINE_BUILDING_PERMS: BuildingPermMap = {
	x03: PERM_PIPELINE.BUILDING_X03,
	x12: PERM_PIPELINE.BUILDING_X12,
};
