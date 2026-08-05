import type {
	AlarmListQuery,
	StatCard,
	StatCardAssets,
	StatusFilter,
	WarningStats,
	WarningStatus,
} from "./interface";

/**
 * 状态筛选项。
 */
export const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "全部", value: "all" },
	{ label: "已解决", value: "processed" },
	{ label: "未解决", value: "unprocessed" },
];

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
