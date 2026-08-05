/**
 * 处理状态（展示用）。
 */
export type WarningStatus = "processed" | "unprocessed";

/**
 * 状态筛选值。
 */
export type StatusFilter = "all" | WarningStatus;

/**
 * 后端告警列表查询参数。
 */
export interface AlarmListQuery {
	pageNum: number;
	pageSize: number;
	status?: string;
	params?: {
		beginAlarmTime?: string;
		endAlarmTime?: string;
	};
}

/**
 * 后端告警行。
 */
export interface IiotAlarm {
	id?: number;
	monitorType?: string;
	deviceName?: string;
	propertyName?: string;
	currentValue?: string;
	thresholdMin?: string;
	thresholdMax?: string;
	levelName?: string;
	levelColor?: string;
	alarmTime?: string;
	status?: string;
	thingId?: string;
	propertyId?: string;
}

/**
 * 今日顶部统计数据。
 */
export interface WarningStats {
	totalToday: number;
	solvedToday: number;
	unsolvedToday: number;
}

/**
 * 顶部统计卡片展示数据。
 */
export interface StatCard {
	key: keyof WarningStats;
	title: string;
	value: number;
	image: string;
	/** 卡片右侧圆形装饰背景。 */
	background: string;
	tone: "blue" | "green" | "orange";
}

/**
 * 统计卡片静态资源。
 */
export interface StatCardAssets {
	totalTodayImg: string;
	solvedTodayImg: string;
	unsolvedTodayImg: string;
	blueCircleBg: string;
	greenCircleBg: string;
	orangeCircleBg: string;
}
