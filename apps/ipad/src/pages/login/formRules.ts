import type { Rule } from "antd/es/form";

/** 用户账号最大字符数 */
export const USERNAME_MAX_LENGTH = 30;

/** 密码最小字符数 */
export const PASSWORD_MIN_LENGTH = 5;

/** 密码最大字符数 */
export const PASSWORD_MAX_LENGTH = 20;

/** 账号：字母、数字、@ */
export const USERNAME_PATTERN = /^[A-Za-z0-9@]+$/;

/** 密码：字母、数字及常见符号 */
export const PASSWORD_PATTERN = /^[A-Za-z0-9!@#$%^&*._-]+$/;

/**
 * 用户账号 Form.Item 校验规则。
 */
export const USERNAME_RULES: Rule[] = [
	{
		required: true,
		whitespace: true,
		message: "请输入用户账号",
	},
	{
		max: USERNAME_MAX_LENGTH,
		message: `最多输入${USERNAME_MAX_LENGTH}个字符`,
	},
	{
		pattern: USERNAME_PATTERN,
		message: "可以包含大小写字母、数字、@",
	},
];

/**
 * 密码 Form.Item 校验规则。
 */
export const PASSWORD_RULES: Rule[] = [
	{ required: true, message: "请输入密码" },
	{
		min: PASSWORD_MIN_LENGTH,
		max: PASSWORD_MAX_LENGTH,
		message: "密码长度必须在5到20个字符之间",
	},
	{
		pattern: PASSWORD_PATTERN,
		message: "仅支持字母、数字及常见符号 !@#$%^&*._-",
	},
];
