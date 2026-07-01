/**
 * 点检台账模块类型定义。
 * 常量/工具函数 → utils.ts，数据接口 → api.ts，表单校验 → formRules.ts。
 */

/** 点检状态：正常 / 即将到期（7 天内）/ 逾期未检 */
export type InspectionStatus = "normal" | "expiring_soon" | "overdue";

/** 点检周期单位 */
export type CycleUnit = "day" | "month";

/** 点检设备记录 */
export interface InspectionDevice {
	id: string;
	code: string;
	name: string;
	deviceType: string;
	manufacturer: string;
	factoryBuilding: string;
	room: string;
	cycleValue: number;
	cycleUnit: CycleUnit;
	lastInspectionDate: string;
	nextInspectionDate: string;
	status: InspectionStatus;
}

/** 顶部统计数据 */
export interface DeviceStats {
	total: number;
	expiringSoon: number;
	overdue: number;
}

/** 顶部统计卡片展示数据 */
export interface StatCard {
	key: keyof DeviceStats;
	title: string;
	value: number;
	image: string;
	background: string;
	tone: "blue" | "green" | "orange";
	valueColor?: string;
}

/** 统计卡片静态资源 */
export interface StatCardAssets {
	totalImg: string;
	expiringImg: string;
	overdueImg: string;
	blueCircleBg: string;
	greenCircleBg: string;
}

/** 新增/编辑设备表单值 */
export interface DeviceFormValues {
	code: string;
	name: string;
	deviceType: string;
	manufacturer: string;
	factoryBuilding: string;
	room: string;
	cycleValue: number;
	cycleUnit: CycleUnit;
	lastInspectionDate: string;
}

/** 列表筛选条件（draft = 输入中，applied = 已生效） */
export interface DeviceListFilter {
	deviceName: string;
	factoryBuilding: string;
}
