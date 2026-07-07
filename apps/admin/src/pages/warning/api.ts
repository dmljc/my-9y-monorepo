import { request } from "@/utils";
import type {
	RiskLevel,
	StatusFilter,
	WarningItem,
	WarningStats,
	WarningStatus,
	WarningType,
} from "./utils";

/** 告警列表查询参数 */
export interface WarningListParams {
	pageNum: number;
	pageSize: number;
	status?: StatusFilter;
	startTime?: string;
	endTime?: string;
}

/** 告警列表返回结果 */
export interface WarningListResult {
	list: WarningItem[];
	total: number;
	stats: WarningStats;
	pageNum: number;
	pageSize: number;
}

interface IiotAlarm {
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
}

/** 将筛选字段与分页参数组装为接口查询参数 */
export function toListParams(
	pageNum: number,
	pageSize: number,
	dateRange: [string, string] | null,
	status: StatusFilter,
): WarningListParams {
	const params: WarningListParams = {
		pageNum,
		pageSize,
	};
	if (status !== "all") {
		params.status = status;
	}

	if (dateRange) {
		params.startTime = dateRange[0];
		params.endTime = `${dateRange[1]} 23:59:59`;
	}

	return params;
}

function toBackendStatus(status?: StatusFilter): string | undefined {
	if (status === "processed") return "1";
	if (status === "unprocessed") return "0";
	return undefined;
}

function toQuery(params: WarningListParams): Record<string, unknown> {
	const query: Record<string, unknown> = {
		pageNum: params.pageNum,
		pageSize: params.pageSize,
		status: toBackendStatus(params.status),
	};
	if (params.startTime || params.endTime) {
		query.params = {
			beginAlarmTime: params.startTime,
			endAlarmTime: params.endTime,
		};
	}
	return query;
}

function parseRows(data: unknown): { rows: IiotAlarm[]; total: number } {
	if (!data || typeof data !== "object") return { rows: [], total: 0 };
	const record = data as Record<string, unknown>;
	const rows = Array.isArray(record.rows)
		? (record.rows as IiotAlarm[])
		: Array.isArray(record.list)
			? (record.list as IiotAlarm[])
			: [];
	return {
		rows,
		total: typeof record.total === "number" ? record.total : rows.length,
	};
}

function toWarningType(monitorType?: string): WarningType {
	return monitorType === "room" ? "room" : "device";
}

function toWarningStatus(status?: string): WarningStatus {
	return status === "1" || status === "processed" || status === "resolved"
		? "processed"
		: "unprocessed";
}

function toRiskLevel(alarm: IiotAlarm): RiskLevel {
	if (alarm.levelName?.includes("一般")) return "low";
	if (alarm.levelName?.includes("严重")) return "medium";
	if (alarm.levelColor?.toLowerCase().includes("fa8c16")) return "medium";
	if (alarm.levelColor?.toLowerCase().includes("faad14")) return "low";
	return "high";
}

function toWarningItem(alarm: IiotAlarm): WarningItem {
	const name = alarm.propertyName ?? alarm.deviceName ?? "";
	return {
		id: String(alarm.id ?? ""),
		type: toWarningType(alarm.monitorType),
		name,
		currentValue: alarm.currentValue ?? "",
		thresholdRange: `${alarm.thresholdMin ?? ""}-${alarm.thresholdMax ?? ""}`,
		level: toRiskLevel(alarm),
		levelName: alarm.levelName,
		levelColor: alarm.levelColor,
		time: alarm.alarmTime ?? "",
		status: toWarningStatus(alarm.status),
		thingId: alarm.thingId,
	};
}

function parseStats(data: unknown): WarningStats {
	if (!data || typeof data !== "object") {
		return { totalToday: 0, solvedToday: 0, unsolvedToday: 0 };
	}
	const record = data as Record<string, unknown>;
	const totalToday = record.totalToday ?? record.todayTotal ?? record.total;
	const solvedToday =
		record.solvedToday ?? record.resolvedToday ?? record.processedToday;
	const unsolvedToday =
		record.unsolvedToday ??
		record.unresolvedToday ??
		record.unprocessedToday;
	return {
		totalToday: typeof totalToday === "number" ? totalToday : 0,
		solvedToday: typeof solvedToday === "number" ? solvedToday : 0,
		unsolvedToday: typeof unsolvedToday === "number" ? unsolvedToday : 0,
	};
}

/** 获取告警列表（分页） */
export async function list(
	params: WarningListParams,
): Promise<WarningListResult> {
	const [listData, statsData] = await Promise.all([
		request.get("/iiot/alarm/list", { params: toQuery(params) }),
		request.get("/iiot/alarm/stats"),
	]);
	const { rows, total } = parseRows(listData);
	const { pageNum, pageSize } = params;
	return {
		list: rows.map(toWarningItem),
		total,
		stats: parseStats(statsData),
		pageNum,
		pageSize,
	};
}

/** 标记告警为已解决 */
export async function processWarning(id: string): Promise<void> {
	await request.put(`/iiot/alarm/${id}/resolve`);
}
