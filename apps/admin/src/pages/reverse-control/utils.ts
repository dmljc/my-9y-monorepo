import type {
	ControllableProperty,
	DeviceModelItem,
	IiotControlCondition,
	IiotControlRule,
} from "./interface";
import type {
	ConditionJoinOperator,
	ConditionRelation,
	RuleActionFormItem,
	RuleConditionFormItem,
	RuleFormValues,
	SelectOption,
} from "./types";

/** 判断运算符下拉选项 */
export const OPERATOR_OPTIONS = [">", ">=", "=", "<=", "<", "!="].map(
	(value) => ({
		label: value,
		value,
	}),
);

/** 相邻条件之间的 and / or 单选项 */
export const JOIN_OPTIONS = [
	{ label: "and", value: "and" },
	{ label: "or", value: "or" },
];

/** 新增条件默认值 */
export const DEFAULT_CONDITION = {
	operator: ">",
	thresholdValue: 0,
} satisfies Partial<RuleConditionFormItem>;

/** 新增动作默认值 */
export const DEFAULT_ACTION = {
	delaySeconds: 0,
	actionValue: 0,
} satisfies Partial<RuleActionFormItem>;

/** 后端启用状态值 */
export const STATUS_ENABLED = "0";

/** 后端停用状态值 */
export const STATUS_DISABLED = "1";

/**
 * 判断规则是否启用。
 *
 * @param {string | undefined} - 后端 status 字段。
 * @returns {boolean} - 是否启用。
 */
export function isEnabled(status?: string): boolean {
	return status === STATUS_ENABLED;
}

/**
 * 将启用布尔值转为后端 status。
 *
 * @param {boolean} - 是否启用。
 * @returns {string} - 后端 status 值。
 */
export function toStatus(enabled: boolean): string {
	return enabled ? STATUS_ENABLED : STATUS_DISABLED;
}

/**
 * 将后端 conditionLogic 转为表单 conditionRelation。
 *
 * @param {string | undefined} - 后端 conditionLogic。
 * @returns {ConditionRelation} - 表单 conditionRelation。
 */
export function toRelation(conditionLogic?: string): ConditionRelation {
	return conditionLogic === "OR" ? "any" : "all";
}

/**
 * 将表单 conditionRelation 转为后端 conditionLogic。
 *
 * @param {ConditionRelation} - 表单 conditionRelation。
 * @returns {string} - 后端 conditionLogic。
 */
export function toLogic(relation: ConditionRelation): string {
	return relation === "any" ? "OR" : "AND";
}

/**
 * 获取某条条件与上一条件的连接关系。
 *
 * @param {RuleConditionFormItem} - 当前条件。
 * @param {ConditionRelation} - 规则级默认关系。
 * @returns {ConditionJoinOperator} - 连接运算符。
 */
export function getJoinOp(
	condition: RuleConditionFormItem,
	fallback: ConditionRelation = "all",
): ConditionJoinOperator {
	return condition.joinOperator ?? (fallback === "all" ? "and" : "or");
}

/**
 * 根据各条件的连接关系推导规则级 conditionRelation。
 *
 * @param {RuleConditionFormItem[]} - 条件列表。
 * @returns {ConditionRelation} - 规则级关系。
 */
export function deriveRelation(
	conditions: RuleConditionFormItem[],
): ConditionRelation {
	const joins = conditions.slice(1).map((condition) => getJoinOp(condition));
	if (joins.length === 0) return "all";
	if (joins.every((join) => join === "and")) return "all";
	if (joins.every((join) => join === "or")) return "any";
	return "any";
}

/**
 * 编辑时将规则条件标准化为表单值。
 *
 * @param {IiotControlCondition[]} - 后端条件列表。
 * @param {ConditionRelation} - 规则级关系。
 * @returns {RuleConditionFormItem[]} - 表单条件列表。
 */
export function normalizeConditions(
	conditions: IiotControlCondition[],
	conditionRelation: ConditionRelation,
): RuleConditionFormItem[] {
	return conditions.map((item, index) => ({
		modelId: item.modelId,
		propertyId: item.propertyId,
		propertyName: item.propertyName,
		operator: item.operator,
		thresholdValue:
			item.thresholdValue !== undefined && item.thresholdValue !== ""
				? Number(item.thresholdValue)
				: undefined,
		joinOperator:
			index === 0
				? undefined
				: conditionRelation === "all"
					? "and"
					: "or",
	}));
}

/**
 * 将后端规则转为表单初始值。
 *
 * @param {IiotControlRule} - 后端规则实体。
 * @returns {RuleFormValues} - 表单值。
 */
export function toFormValues(rule: IiotControlRule): RuleFormValues {
	const conditionRelation = toRelation(rule.conditionLogic);
	return {
		ruleName: rule.ruleName ?? "",
		description: rule.description ?? "",
		enabled: isEnabled(rule.status),
		conditionRelation,
		conditions: normalizeConditions(
			rule.conditions ?? [],
			conditionRelation,
		),
		actions: (rule.actions ?? []).map((action) => ({
			modelId: action.modelId,
			propertyId: action.propertyId,
			propertyName: action.propertyName,
			delaySeconds: action.delaySeconds ?? 0,
			actionValue:
				action.actionValue !== undefined && action.actionValue !== ""
					? Number(action.actionValue)
					: 0,
		})),
	};
}

/**
 * 将表单值转为后端提交体。
 *
 * @param {RuleFormValues} - 表单值。
 * @param {number | undefined} - 编辑时的规则 id。
 * @returns {IiotControlRule} - 后端实体。
 */
export function toRule(values: RuleFormValues, id?: number): IiotControlRule {
	const conditionRelation = deriveRelation(values.conditions);
	return {
		id,
		ruleName: values.ruleName.trim(),
		description: values.description.trim(),
		conditionLogic: toLogic(conditionRelation),
		status: toStatus(values.enabled),
		conditions: values.conditions.map((item) => ({
			modelId: item.modelId,
			thingId: item.modelId,
			propertyId: item.propertyId,
			propertyName: item.propertyName,
			operator: item.operator,
			thresholdValue:
				item.thresholdValue !== undefined
					? String(item.thresholdValue)
					: undefined,
		})),
		actions: values.actions.map((item) => ({
			modelId: item.modelId,
			thingId: item.modelId,
			propertyId: item.propertyId,
			propertyName: item.propertyName,
			delaySeconds: item.delaySeconds,
			actionValue:
				item.actionValue !== undefined
					? String(item.actionValue)
					: undefined,
		})),
	};
}

/**
 * 将物模型列表转为设备下拉选项。
 *
 * @param {DeviceModelItem[]} - 物模型列表。
 * @returns {SelectOption[]} - 下拉选项。
 */
export function toModelOptions(models: DeviceModelItem[]): SelectOption[] {
	return models.map((item) => ({
		label: item.model_name,
		value: item.model_id,
	}));
}

/**
 * 将可控属性列表转为点位下拉选项。
 *
 * @param {ControllableProperty[]} - 可控属性列表。
 * @returns {SelectOption[]} - 下拉选项。
 */
export function toPropertyOptions(
	properties: ControllableProperty[],
): SelectOption[] {
	return properties.map((item) => ({
		label: item.propertyName,
		value: item.propertyId,
	}));
}

/**
 * 合并当前选中项与接口选项，避免编辑回显时 label 缺失。
 *
 * @param {SelectOption[]} - 接口返回选项。
 * @param {string | undefined} - 当前选中 value。
 * @param {string | undefined} - 当前展示 label。
 * @returns {SelectOption[]} - 合并后的选项。
 */
export function mergeOption(
	options: SelectOption[],
	value?: string,
	label?: string,
): SelectOption[] {
	if (!value) return options;
	if (options.some((item) => item.value === value)) return options;
	if (!label) return options;
	return [{ label, value }, ...options];
}

/**
 * 根据 modelId 解析展示名称。
 *
 * @param {string | undefined} - 物模型 id。
 * @param {SelectOption[]} - 设备选项。
 * @returns {string | undefined} - 展示名称。
 */
export function modelLabel(
	modelId: string | undefined,
	modelOptions: SelectOption[],
): string | undefined {
	return modelOptions.find((item) => item.value === modelId)?.label;
}

/**
 * 获取规则关联的主设备名称（用于展示）。
 *
 * @param {IiotControlRule} - 规则实体。
 * @param {SelectOption[]} - 设备选项。
 * @returns {string} - 主设备名称。
 */
export function primaryModelLabel(
	rule: IiotControlRule,
	modelOptions: SelectOption[],
): string {
	const modelId = rule.conditions?.[0]?.modelId ?? rule.actions?.[0]?.modelId;
	return (
		modelLabel(modelId, modelOptions) ??
		rule.conditions?.[0]?.propertyName ??
		"未配置设备"
	);
}

/**
 * 将反控规则的条件与动作拼接为可读摘要。
 *
 * @param {IiotControlRule} - 规则实体。
 * @returns {string} - 摘要文本。
 */
export function ruleSummary(rule: IiotControlRule): string {
	const relation = toRelation(rule.conditionLogic);
	const relationText = relation === "all" ? "全部满足" : "任一满足";
	const conditionText = (rule.conditions ?? [])
		.map((condition, index) => {
			const expr = `${condition.propertyName ?? condition.propertyId} ${condition.operator} ${condition.thresholdValue ?? ""}`;
			if (index === 0) return expr;
			const join = relation === "all" ? " 且 " : " 或 ";
			return `${join}${expr}`;
		})
		.join("");
	const actionText = (rule.actions ?? [])
		.map(
			(action) =>
				`${action.propertyName ?? action.propertyId} 延迟${action.delaySeconds ?? 0}s 执行=${action.actionValue ?? ""}`,
		)
		.join("，");

	return `${relationText}：${conditionText || "未配置条件"}；执行：${actionText || "未配置动作"}`;
}
