import dayjs, { type Dayjs } from "dayjs";
import type { SysOperLog } from "./interface";

/**
 * 操作日志快捷时间范围。
 */
export type QuickRange = "24h" | "7d" | "30d";

/** 默认快捷时间范围。 */
export const DEFAULT_QUICK_RANGE: QuickRange = "24h";

/** 列表查询时间格式。 */
export const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

/** Excel 文件 MIME 类型。 */
export const XLSX_MIME =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * 快捷时间范围选项。
 */
export const QUICK_RANGE_OPTIONS = [
	{ label: "近24小时", value: "24h" },
	{ label: "近7天", value: "7d" },
	{ label: "近30天", value: "30d" },
];

/**
 * 业务类型字典（对应后端 businessType）。
 */
const BUSINESS_TYPE_LABEL: Record<number, string> = {
	0: "其它",
	1: "新增",
	2: "修改",
	3: "删除",
	4: "授权",
	5: "导出",
	6: "导入",
	7: "强退",
	8: "生成代码",
	9: "清空数据",
};

/**
 * 根据快捷范围生成日期区间。
 *
 * @param {QuickRange} - 快捷范围。
 * @returns {[Dayjs, Dayjs]} - 起止日期时间。
 */
export function getQuickRangeDates(range: QuickRange): [Dayjs, Dayjs] {
	const end = dayjs();
	const amountMap: Record<QuickRange, number> = {
		"24h": 1,
		"7d": 7,
		"30d": 30,
	};
	return [end.subtract(amountMap[range], "day"), end];
}

/**
 * 将操作模块与业务类型拼装为操作描述文案。
 *
 * @param {SysOperLog} - 操作日志记录。
 * @returns {string} - 操作描述文案。
 */
export function formatOperAction(log: SysOperLog): string {
	const typeLabel =
		log.businessType !== undefined
			? BUSINESS_TYPE_LABEL[log.businessType]
			: undefined;
	if (log.title && typeLabel && typeLabel !== "其它") {
		return `${log.title}${typeLabel}`;
	}
	return log.title ?? "";
}

/**
 * 生成导出文件名。
 *
 * @returns {string} - 导出文件名。
 */
export function buildExportFileName(): string {
	return "操作日志.xlsx";
}

/**
 * 解析导出接口返回的 Blob，识别 JSON 错误响应。
 *
 * @param {Blob} - 导出接口返回的 Blob。
 * @returns {Promise<Blob>} - 可下载的 Excel Blob。
 */
export async function resolveExportBlob(data: Blob): Promise<Blob> {
	if (!data.type.includes("json") && !data.type.includes("text")) {
		return data;
	}

	const text = await data.text();
	try {
		const result = JSON.parse(text) as {
			code?: number;
			msg?: string;
			message?: string;
		};
		if (result.code !== undefined && result.code !== 200) {
			throw new Error(result.msg ?? result.message ?? "导出失败");
		}
	} catch (error) {
		if (error instanceof SyntaxError) {
			return new Blob([text], { type: XLSX_MIME });
		}
		throw error;
	}

	return new Blob([text], { type: XLSX_MIME });
}

/**
 * 触发浏览器下载 Blob 文件。
 *
 * @param {Blob} - 文件内容。
 * @param {string} - 下载文件名。
 * @returns {void} - 无返回值。
 */
export function downloadBlob(blob: Blob, fileName: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
