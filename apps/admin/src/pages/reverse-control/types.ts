export type ConditionRelation = "all" | "any";

/** 相邻条件之间的逻辑关系 */
export type ConditionJoinOperator = "and" | "or";

export interface RuleCondition {
	deviceName: string;
	pointName: string;
	operator: string;
	value: number;
	/** 与上一条件的连接关系，首条条件无需设置 */
	joinOperator?: ConditionJoinOperator;
}

export interface RuleAction {
	deviceName: string;
	pointName: string;
	delay: number;
	targetValue: number;
}

export interface ReverseControlRule {
	id: string;
	name: string;
	description: string;
	conditionRelation: ConditionRelation;
	conditions: RuleCondition[];
	actions: RuleAction[];
	triggerCount: number;
	enabled: boolean;
}

export interface RuleFormValues {
	name: string;
	description: string;
	conditionRelation: ConditionRelation;
	conditions: RuleCondition[];
	actions: RuleAction[];
	enabled: boolean;
}
