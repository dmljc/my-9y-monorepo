import mockData from "./mockData.json";
import type {
	ConditionJoinOperator,
	ConditionRelation,
	ReverseControlRule,
	RuleAction,
	RuleCondition,
} from "./types";

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

export const MOCK_RULES: ReverseControlRule[] =
	mockData as ReverseControlRule[];

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
	delay: 0,
	targetValue: 0,
};

/** 规则名称最大长度（汉字） */
export const RULE_NAME_MAX_LENGTH = 12;

/** 规则描述最大长度（汉字） */
export const RULE_DESCRIPTION_MAX_LENGTH = 18;

/** 动作延迟范围 */
export const ACTION_DELAY_MIN = 0;
export const ACTION_DELAY_MAX = 99.9;

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
 * 获取某条条件与上一条件的连接关系
 */
export function getConditionJoinOperator(
	condition: RuleCondition,
	fallback: ConditionRelation = "all",
): ConditionJoinOperator {
	return condition.joinOperator ?? (fallback === "all" ? "and" : "or");
}

/** 根据各条件的连接关系推导规则级 conditionRelation */
export function deriveConditionRelation(
	conditions: RuleCondition[],
): ConditionRelation {
	const joins = conditions
		.slice(1)
		.map((condition) => getConditionJoinOperator(condition));
	if (joins.length === 0) return "all";
	if (joins.every((join) => join === "and")) return "all";
	if (joins.every((join) => join === "or")) return "any";
	return "any";
}

/** 编辑时将规则条件标准化为表单值（补齐 joinOperator） */
export function normalizeConditionsForForm(
	conditions: RuleCondition[],
	conditionRelation: ConditionRelation,
): RuleCondition[] {
	return conditions.map((item, index) => ({
		...item,
		joinOperator:
			index === 0
				? undefined
				: (item.joinOperator ??
					(conditionRelation === "all" ? "and" : "or")),
	}));
}

/**
 * 将反控规则的条件与动作拼接为可读的摘要文本
 * 示例：全部满足：温湿度传感器/环境温度 > 30 且 ...；执行：空调/开关状态=1，...
 */
export function createConditionSummary(rule: ReverseControlRule): string {
	const joins = rule.conditions
		.slice(1)
		.map((condition) => getConditionJoinOperator(condition, rule.conditionRelation));
	const hasMixedJoins = new Set(joins).size > 1;
	const relationText = hasMixedJoins
		? "混合条件"
		: rule.conditionRelation === "all"
			? "全部满足"
			: "任一满足";
	const conditionText = rule.conditions
		.map((condition, index) => {
			const expr = `${condition.deviceName}/${condition.pointName} ${condition.operator} ${condition.value}`;
			if (index === 0) return expr;
			const join = getConditionJoinOperator(
				condition,
				rule.conditionRelation,
			);
			return `${join === "and" ? " 且 " : " 或 "}${expr}`;
		})
		.join("");
	const actionText = rule.actions
		.map(
			(action) =>
				`${action.deviceName}/${action.pointName} 延迟${action.delay}s 执行=${action.targetValue}`,
		)
		.join("，");

	return `${relationText}：${conditionText || "未配置条件"}；执行：${actionText || "未配置动作"}`;
}

/** 校验规则名称是否重复 */
export function isDuplicateRuleName(
	rules: ReverseControlRule[],
	name: string,
	excludeId?: string,
): boolean {
	const trimmed = name.trim();
	if (!trimmed) return false;
	return rules.some((rule) => rule.name === trimmed && rule.id !== excludeId);
}

/** 根据规则名称或设备名称过滤规则列表 */
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
