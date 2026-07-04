/** 相邻条件之间的逻辑关系 */
export type ConditionJoinOperator = "and" | "or";

/** 规则级条件关系（表单推导用） */
export type ConditionRelation = "all" | "any";

/** 表单中的触发条件（含 UI 用 joinOperator） */
export interface RuleConditionFormItem {
	modelId?: string;
	propertyId?: string;
	propertyName?: string;
	operator?: string;
	thresholdValue?: number;
	joinOperator?: ConditionJoinOperator;
}

/** 表单中的执行动作 */
export interface RuleActionFormItem {
	modelId?: string;
	propertyId?: string;
	propertyName?: string;
	delaySeconds?: number;
	actionValue?: number;
}

/** 新增 / 编辑表单值 */
export interface RuleFormValues {
	ruleName: string;
	description: string;
	/** 由 conditions 推导，表单不单独绑定 */
	conditionRelation?: ConditionRelation;
	conditions: RuleConditionFormItem[];
	actions: RuleActionFormItem[];
	enabled: boolean;
}

/** Select 选项 */
export interface SelectOption {
	label: string;
	value: string;
}
