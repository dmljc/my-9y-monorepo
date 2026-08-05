import { COLOR_PRESET_ITEMS } from "@/pages/warning-levels/utils";
import type {
	AlarmListQuery,
	IiotAlarm,
	RiskLevel,
	StatCard,
	StatCardAssets,
	StatusFilter,
	WarningItem,
	WarningStats,
	WarningStatus,
	WarningType,
} from "./interface";

/**
 * 告警类型展示文案。
 */
export const TYPE_LABEL: Record<WarningType, string> = {
	room: "房间",
	device: "设备",
};

/**
 * 状态筛选项。
 */
export const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "全部", value: "all" },
	{ label: "已解决", value: "processed" },
	{ label: "未解决", value: "unprocessed" },
];

/**
 * 风险等级展示文案。
 */
export const LEVEL_LABEL: Record<RiskLevel, string> = {
	high: "高",
	medium: "中",
	low: "低",
};

const PRESET_COLOR_BY_NAME = Object.fromEntries(
	COLOR_PRESET_ITEMS.map((item) => [item.name, item.color]),
) as Record<(typeof COLOR_PRESET_ITEMS)[number]["name"], string>;

/**
 * 高 / 中 / 低 回退色，对齐报警等级预置光谱（红 / 橙 / 蓝）。
 */
export const LEVEL_COLOR: Record<RiskLevel, string> = {
	high: PRESET_COLOR_BY_NAME.红,
	medium: PRESET_COLOR_BY_NAME.橙,
	low: PRESET_COLOR_BY_NAME.蓝,
};

/**
 * 处理状态展示文案。
 */
export const STATUS_LABEL: Record<WarningStatus, string> = {
	processed: "已解决",
	unprocessed: "未解决",
};

/**
 * 将筛选状态转为后端 status 值。
 *
 * @param {StatusFilter} - 前端筛选状态。
 * @returns {string | undefined} - 后端 status；全部时不传。
 */
function toBackendStatus(status: StatusFilter): string | undefined {
	if (status === "processed") return "1";
	if (status === "unprocessed") return "0";
	return undefined;
}

/**
 * 组装告警列表查询参数。
 *
 * @param {number} - 页码。
 * @param {number} - 每页条数。
 * @param {[string, string] | null} - 时间范围（起止日期）。
 * @param {StatusFilter} - 状态筛选。
 * @returns {AlarmListQuery} - 后端列表查询参数。
 */
export function toAlarmListQuery(
	pageNum: number,
	pageSize: number,
	dateRange: [string, string] | null,
	status: StatusFilter,
): AlarmListQuery {
	const query: AlarmListQuery = {
		pageNum,
		pageSize,
	};
	const backendStatus = toBackendStatus(status);
	if (backendStatus !== undefined) {
		query.status = backendStatus;
	}
	if (dateRange) {
		query.params = {
			beginAlarmTime: dateRange[0],
			endAlarmTime: `${dateRange[1]} 23:59:59`,
		};
	}
	return query;
}

/**
 * 将后端 monitorType 转为展示类型。
 *
 * @param {string | undefined} - 后端监控类型。
 * @returns {WarningType} - 展示用告警类型。
 */
function toWarningType(monitorType?: string): WarningType {
	return monitorType === "room" ? "room" : "device";
}

/**
 * 将后端 status 转为展示状态。
 *
 * @param {string | undefined} - 后端状态值。
 * @returns {WarningStatus} - 展示用处理状态。
 */
function toWarningStatus(status?: string): WarningStatus {
	if (status === "1" || status === "processed" || status === "resolved") {
		return "processed";
	}
	return "unprocessed";
}

/**
 * 根据等级名称 / 颜色推断风险档位。
 *
 * @param {IiotAlarm} - 后端告警行。
 * @returns {RiskLevel} - 展示用风险等级。
 */
function toRiskLevel(alarm: IiotAlarm): RiskLevel {
	if (alarm.levelName?.includes("一般")) return "low";
	if (alarm.levelName?.includes("严重")) return "medium";
	if (alarm.levelColor?.toLowerCase().includes("fa8c16")) return "medium";
	if (alarm.levelColor?.toLowerCase().includes("faad14")) return "low";
	return "high";
}

/**
 * 将后端告警行转为表格行。
 *
 * @param {IiotAlarm} - 后端告警行。
 * @returns {WarningItem} - 表格展示记录。
 */
export function toWarningItem(alarm: IiotAlarm): WarningItem {
	return {
		id: String(alarm.id ?? ""),
		type: toWarningType(alarm.monitorType),
		name: alarm.propertyName ?? alarm.deviceName ?? "",
		currentValue: alarm.currentValue ?? "",
		thresholdRange: `${alarm.thresholdMin ?? ""}-${alarm.thresholdMax ?? ""}`,
		level: toRiskLevel(alarm),
		levelName: alarm.levelName,
		levelColor: alarm.levelColor,
		time: alarm.alarmTime ?? "",
		status: toWarningStatus(alarm.status),
		thingId: alarm.thingId,
		propertyId: alarm.propertyId,
	};
}

/**
 * 将统计接口 data 规范为顶部卡片数据。
 *
 * @param {unknown} - `/iiot/alarm/stats` 解包后的 data。
 * @returns {WarningStats} - 今日统计。
 */
export function toWarningStats(data: unknown): WarningStats {
	if (!data || typeof data !== "object") {
		return { totalToday: 0, solvedToday: 0, unsolvedToday: 0 };
	}
	const record = data as Record<string, unknown>;
	return {
		totalToday:
			typeof record.totalToday === "number" ? record.totalToday : 0,
		solvedToday:
			typeof record.solvedToday === "number" ? record.solvedToday : 0,
		unsolvedToday:
			typeof record.unsolvedToday === "number" ? record.unsolvedToday : 0,
	};
}

/**
 * 根据统计数据构建顶部卡片。
 *
 * @param {WarningStats} - 今日统计。
 * @param {StatCardAssets} - 卡片插图与圆形背景资源。
 * @returns {StatCard[]} - 顶部三张统计卡片。
 */
export function buildStatCards(
	stats: WarningStats,
	assets: StatCardAssets,
): StatCard[] {
	return [
		{
			key: "totalToday",
			title: "今日总警告",
			value: stats.totalToday,
			image: assets.totalTodayImg,
			background: assets.blueCircleBg,
			tone: "blue",
		},
		{
			key: "solvedToday",
			title: "今日已解决",
			value: stats.solvedToday,
			image: assets.solvedTodayImg,
			background: assets.greenCircleBg,
			tone: "green",
		},
		{
			key: "unsolvedToday",
			title: "今日未解决",
			value: stats.unsolvedToday,
			image: assets.unsolvedTodayImg,
			background: assets.orangeCircleBg,
			tone: "orange",
		},
	];
}
