import type { Rule } from "antd/es/form";
import { FLOW_RATE_MAX, FLOW_RATE_MIN, FLOW_RATE_RANGE_MSG } from "./utils";

/** 设备编码 / 名称 / 取样房间号 / 管道号最大长度。 */
export const MAX_LENGTH_40 = 40;

/**
 * 设备编码校验。
 */
export const deviceCodeRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入编码" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/**
 * 设备名称校验。
 */
export const deviceNameRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入设备名称" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/**
 * 取样房间号 / 房间号校验。
 */
export const sampleRoomRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入房间号" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/**
 * 管道号（IN）校验（弹窗：必填 + 仅数字）。
 */
export const pipeInRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入管道号" },
	{ pattern: /^\d+$/, message: "管道号仅支持数字" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/**
 * 管道号（OUT）校验（弹窗：必填 + 仅数字）。
 */
export const pipeOutRules: Rule[] = pipeInRules;

/**
 * 流量校验（弹窗：必填 + 0.00～999999.99）。
 */
export const flowRateRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入流量" },
	{
		pattern: /^\d+(\.\d{1,2})?$/,
		message: FLOW_RATE_RANGE_MSG,
	},
	{
		validator: (_, value: string) => {
			if (!value?.trim()) return Promise.resolve();
			const num = Number(value);
			if (
				Number.isNaN(num) ||
				num < FLOW_RATE_MIN ||
				num > FLOW_RATE_MAX
			) {
				return Promise.reject(new Error(FLOW_RATE_RANGE_MSG));
			}
			return Promise.resolve();
		},
	},
];
