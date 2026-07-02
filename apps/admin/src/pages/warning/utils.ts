import dayjs from "dayjs";
import mockData from "./mockData.json";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 告警风险等级 */
export type RiskLevel = "high" | "medium" | "low";

/** 告警类型 */
export type WarningType = "room" | "device";

/** 处理状态 */
export type WarningStatus = "processed" | "unprocessed";

/** 状态筛选值 */
export type StatusFilter = "all" | WarningStatus;

/** 告警记录 */
export interface WarningItem {
	id: string;
	type: WarningType;
	name: string;
	currentValue: string;
	thresholdRange: string;
	level: RiskLevel;
	time: string;
	status: WarningStatus;
}

/** 今日顶部统计数据 */
export interface WarningStats {
	totalToday: number;
	solvedToday: number;
	unsolvedToday: number;
}

/** 顶部统计卡片展示数据 */
export interface StatCard {
	key: keyof WarningStats;
	title: string;
	value: number;
	image: string;
	/** 卡片右侧圆形装饰背景 */
	background: string;
	tone: "blue" | "green" | "orange";
}

/** 统计卡片静态资源 */
export interface StatCardAssets {
	totalTodayImg: string;
	solvedTodayImg: string;
	unsolvedTodayImg: string;
	blueCircleBg: string;
	greenCircleBg: string;
	orangeCircleBg: string;
}

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 本地测试数据（接入 API 后移除） */
export const MOCK_WARNINGS: WarningItem[] = mockData as WarningItem[];

export const TYPE_LABEL: Record<WarningType, string> = {
	room: "房间",
	device: "设备",
};

export const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "全部", value: "all" },
	{ label: "已解决", value: "processed" },
	{ label: "未解决", value: "unprocessed" },
];

export const LEVEL_LABEL: Record<RiskLevel, string> = {
	high: "高",
	medium: "中",
	low: "低",
};

export const LEVEL_COLOR: Record<RiskLevel, string> = {
	high: "error",
	medium: "warning",
	low: "processing",
};

export const STATUS_LABEL: Record<WarningStatus, string> = {
	processed: "已解决",
	unprocessed: "未解决",
};

export const STATUS_COLOR: Record<WarningStatus, string> = {
	processed: "success",
	unprocessed: "warning",
};

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 计算今日告警统计 */
export function calcTodayStats(warnings: WarningItem[]): WarningStats {
	const today = dayjs().format("YYYY-MM-DD");
	const todayList = warnings.filter(
		(item) => item.time.slice(0, 10) === today,
	);

	return {
		totalToday: todayList.length,
		solvedToday: todayList.filter((item) => item.status === "processed")
			.length,
		unsolvedToday: todayList.filter((item) => item.status === "unprocessed")
			.length,
	};
}

/** 从 mock 数据计算今日统计（首屏占位） */
export function getMockStats(): WarningStats {
	return calcTodayStats(MOCK_WARNINGS);
}

/** 根据统计数据构建顶部卡片 */
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

/** 客户端过滤（mock 阶段使用，接入 API 后由服务端筛选） */
export function filterWarnings(
	warnings: WarningItem[],
	status: StatusFilter,
	dateRange: [string, string] | null,
): WarningItem[] {
	return warnings.filter((item) => {
		if (status !== "all" && item.status !== status) return false;

		if (dateRange) {
			const [start, end] = dateRange;
			const itemDate = item.time.slice(0, 10);
			if (itemDate < start || itemDate > end) {
				return false;
			}
		}

		return true;
	});
}

/** 构建告警前后 15 分钟历史数据页跳转路径 */
export function buildWarningDeviceDataPath(record: WarningItem): string {
	const center = dayjs(record.time);
	const params = new URLSearchParams({
		startTime: center.subtract(15, "minute").format("YYYY-MM-DD HH:mm:ss"),
		endTime: center.add(15, "minute").format("YYYY-MM-DD HH:mm:ss"),
		name: record.name,
		type: record.type,
	});

	return `/historical-data?${params.toString()}`;
}
