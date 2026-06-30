export type ConditionRelation = "all" | "any";

export interface RuleCondition {
	deviceName: string;
	pointName: string;
	operator: string;
	value: number;
}

export interface RuleAction {
	deviceName: string;
	pointName: string;
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
