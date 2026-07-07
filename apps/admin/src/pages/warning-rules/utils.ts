// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 监控对象类型 */
export type MonitorType = "device" | "room";

/** 报警规则 */
export interface WarningRule {
	id: string;
	name: string;
	monitorType: MonitorType;
	targetName: string;
	propertyKey: string;
	thresholdMin: number;
	thresholdMax: number;
	levelId: string;
	levelName: string;
	levelColor: string;
	enabled: boolean;
}

/** 新增 / 编辑表单值 */
export interface RuleFormValues {
	name: string;
	monitorType: MonitorType;
	targetName: string;
	propertyKey: string;
	thresholdMin: number;
	thresholdMax: number;
	levelId: string;
	enabled: boolean;
}

/** 报警等级选项 */
export interface RuleLevelOption {
	value: string;
	label: string;
	color?: string;
}

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

export const MONITOR_TYPE_LABEL: Record<MonitorType, string> = {
	device: "设备",
	room: "房间",
};

export const MONITOR_TYPE_OPTIONS = (
	Object.entries(MONITOR_TYPE_LABEL) as [MonitorType, string][]
).map(([value, label]) => ({ label, value }));

export const DEVICE_OPTIONS = [
	"反应釜-A114",
	"料线控制器",
	"温控传感器-A101",
	"压力表-B203",
	"电机控制器-C305",
].map((value) => ({ label: value, value }));

export const ROOM_OPTIONS = ["101", "A区-201", "B区-305", "C区-108"].map(
	(value) => ({ label: value, value }),
);

export const PROPERTY_OPTIONS = [
	"/114_FV201_KDFK",
	"/101_ROOM_TEMP",
	"/201_NH3",
	"/FEED_LINE_LOAD",
	"/114_FV201_TEMP",
	"/ROOM_HUMIDITY",
].map((value) => ({ label: value, value }));

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 格式化阈值范围为展示文本 */
export function formatThresholdRange(min: number, max: number): string {
	return `${min}-${max}`;
}
