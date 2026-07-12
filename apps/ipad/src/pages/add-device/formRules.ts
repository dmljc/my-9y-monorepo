import type { Rule } from "antd/es/form";

/** 设备编码 / 名称 / 厂家最大长度。 */
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
 * 设备厂家校验。
 */
export const manufacturerRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入设备厂家" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];
