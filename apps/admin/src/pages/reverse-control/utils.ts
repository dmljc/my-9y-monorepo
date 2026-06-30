import type { ReverseControlRule, RuleAction, RuleCondition } from "./types";

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 设备下拉选项 */
export const DEVICE_OPTIONS = [
	"温湿度传感器",
	"空调",
	"阀门",
	"排水泵1",
	"排水泵2",
	"风机",
].map((value) => ({ label: value, value }));

/** 点位下拉选项 */
export const POINT_OPTIONS = [
	"环境温度",
	"环境湿度",
	"开关状态",
	"目标温度",
	"运行频率",
	"阀门开度",
].map((value) => ({ label: value, value }));

/** 判断运算符下拉选项 */
export const OPERATOR_OPTIONS = [">", ">=", "=", "<=", "<", "!="].map(
	(value) => ({
		label: value,
		value,
	}),
);

/** 条件关系下拉选项 */
export const RELATION_OPTIONS = [
	{ label: "满足以下全部条件", value: "all" },
	{ label: "满足以下任一条件", value: "any" },
];

/** 新增条件默认值 */
export const DEFAULT_CONDITION: RuleCondition = {
	deviceName: "",
	pointName: "",
	operator: ">",
	value: 0,
};

/** 新增动作默认值 */
export const DEFAULT_ACTION: RuleAction = {
	deviceName: "",
	pointName: "",
	targetValue: 0,
};

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 获取规则的主设备名称
 * 优先取第一个条件的设备名，其次第一个动作的设备名，兜底返回 "未配置设备"
 */
export function getPrimaryDeviceName(rule: ReverseControlRule): string {
	return (
		rule.conditions[0]?.deviceName ||
		rule.actions[0]?.deviceName ||
		"未配置设备"
	);
}

/**
 * 将反控规则的条件与动作拼接为可读的摘要文本
 * 示例：全部满足：温湿度传感器/环境温度 > 30 且 ...；执行：空调/开关状态=1，...
 */
export function createConditionSummary(rule: ReverseControlRule): string {
	const relationText =
		rule.conditionRelation === "all" ? "全部满足" : "任一满足";
	const conditionText = rule.conditions
		.map(
			(condition) =>
				`${condition.deviceName}/${condition.pointName} ${condition.operator} ${condition.value}`,
		)
		.join(rule.conditionRelation === "all" ? " 且 " : " 或 ");
	const actionText = rule.actions
		.map(
			(action) =>
				`${action.deviceName}/${action.pointName}=${action.targetValue}`,
		)
		.join("，");

	return `${relationText}：${conditionText || "未配置条件"}；执行：${actionText || "未配置动作"}`;
}

/**
 * 根据规则名称或设备名称过滤规则列表
 */
export function filterRules(
	rules: ReverseControlRule[],
	deviceName: string,
): ReverseControlRule[] {
	if (!deviceName) return rules;
	return rules.filter(
		(rule) =>
			rule.name.includes(deviceName) ||
			getPrimaryDeviceName(rule).includes(deviceName) ||
			rule.conditions.some((item) =>
				item.deviceName.includes(deviceName),
			) ||
			rule.actions.some((item) => item.deviceName.includes(deviceName)),
	);
}
