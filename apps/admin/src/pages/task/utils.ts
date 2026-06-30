import type { Dayjs } from "dayjs";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 筛选条件状态 */
export interface FilterState {
	dateRange: [Dayjs, Dayjs] | null;
}

/** 汇总卡片色调 */
export type SummaryTone = "blue" | "green" | "orange";

/** 汇总卡片数据项 */
export interface SummaryItem {
	label: string;
	value: number;
	tone: SummaryTone;
}

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 任务状态中文映射 */
export const TASK_STATUS_LABEL: Record<string, string> = {
	pending: "待完成",
	done: "已完成",
};

/** 默认筛选条件 */
export const DEFAULT_FILTER: FilterState = { dateRange: null };

/** 任务区域下拉选项 */
export const AREA_OPTIONS = [
	{ label: "X03", value: "X03" },
	{ label: "X05", value: "X05" },
	{ label: "区域A", value: "区域A" },
	{ label: "区域B", value: "区域B" },
];

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 根据任务统计数据构建汇总卡片数组
 */
export function buildSummaryItems(
	total: number,
	totalDone: number,
	totalPending: number,
): SummaryItem[] {
	return [
		{ label: "全部任务", value: total, tone: "blue" },
		{ label: "已完成", value: totalDone, tone: "green" },
		{ label: "未完成", value: totalPending, tone: "orange" },
	];
}

/**
 * 将表单值格式化为 API 需要的请求参数
 */
export function formatTaskPayload(values: {
	title: string;
	area: string;
	device: string;
	taskTime: [Dayjs, Dayjs];
}): {
	title: string;
	area: string;
	device: string;
	taskTimeStart: string;
	taskTimeEnd: string;
} {
	return {
		title: values.title,
		area: values.area,
		device: values.device,
		taskTimeStart: values.taskTime[0].format("YYYY-MM-DD HH:mm"),
		taskTimeEnd: values.taskTime[1].format("YYYY-MM-DD HH:mm"),
	};
}
