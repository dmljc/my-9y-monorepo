import type { Rule } from "antd/es/form";

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
