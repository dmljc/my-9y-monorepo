import type {
	ControllableProperty,
	DeviceThingItem,
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
export const OPERATOR_OPTIONS = [">", ">=", "==", "<=", "<", "!="].map(
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

/** 规则名称最大长度。 */
export const MAX_LENGTH_12 = 12;

/** 规则描述最大长度。 */
export const MAX_LENGTH_18 = 18;

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
		thingId: item.thingId ?? item.modelId,
		propertyId: item.propertyId,
		propertyName: item.propertyName,
		operator: item.operator === "=" ? "==" : item.operator,
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
			thingId: action.thingId ?? action.modelId,
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
			thingId: item.thingId,
			propertyId: item.propertyId,
			propertyName: item.propertyName,
			operator: item.operator,
			thresholdValue:
				item.thresholdValue !== undefined
					? String(item.thresholdValue)
					: undefined,
		})),
		actions: values.actions.map((item) => ({
			thingId: item.thingId,
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
 * 规范化 things 接口返回为物实例数组。
 *
 * @param {unknown} - things 接口 data。
 * @returns {DeviceThingItem[]} - 物实例列表。
 */
export function normalizeThingsList(data: unknown): DeviceThingItem[] {
	if (Array.isArray(data)) return data as DeviceThingItem[];
	if (!data || typeof data !== "object") return [];
	const record = data as Record<string, unknown>;
	if (Array.isArray(record.things)) return record.things as DeviceThingItem[];
	if (record.data && typeof record.data === "object") {
		const nested = record.data as Record<string, unknown>;
		if (Array.isArray(nested.things)) {
			return nested.things as DeviceThingItem[];
		}
		if (Array.isArray(record.data)) return record.data as DeviceThingItem[];
	}
	return [];
}

/**
 * 将物实例列表转为设备下拉选项（label=thing_name，value=thing_id）。
 *
 * @param {DeviceThingItem[]} - 物实例列表。
 * @returns {SelectOption[]} - 下拉选项。
 */
export function toThingOptions(things: DeviceThingItem[]): SelectOption[] {
	return things.flatMap((item) => {
		const value = String(item.thing_id ?? item.thingId ?? "").trim();
		if (!value) return [];
		const name = String(item.thing_name ?? item.thingName ?? "").trim();
		return [
			{
				label: name || value,
				value,
			},
		];
	});
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
	return properties.flatMap((item) => {
		const value = item.property_id ?? item.propertyId;
		if (!value) return [];
		return [
			{
				label: item.property_name ?? item.propertyName ?? value,
				value,
			},
		];
	});
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
 * 将触发条件格式化为表格展示文案。
 *
 * @param {IiotControlRule} - 规则实体。
 * @returns {string} - 条件摘要，如「点位 >= 10 and 点位 <= 0」。
 */
export function formatConditions(rule: IiotControlRule): string {
	const conditions = rule.conditions ?? [];
	if (conditions.length === 0) return "";
	const join = rule.conditionLogic === "OR" ? " or " : " and ";
	return conditions
		.map((item) => {
			const name = item.propertyName ?? item.propertyId ?? "";
			const operator =
				item.operator === "=" ? "==" : (item.operator ?? "");
			const value = item.thresholdValue ?? "";
			return [name, operator, value].filter(Boolean).join(" ");
		})
		.filter(Boolean)
		.join(join);
}

/**
 * 将执行动作格式化为表格展示文案。
 *
 * @param {IiotControlRule} - 规则实体。
 * @returns {string} - 动作摘要，如「点位 延迟0s 执行=1」。
 */
export function formatActions(rule: IiotControlRule): string {
	const actions = rule.actions ?? [];
	if (actions.length === 0) return "";
	return actions
		.map((item) => {
			const name = item.propertyName ?? item.propertyId ?? "";
			const delay = item.delaySeconds ?? 0;
			const value = item.actionValue ?? "";
			return `${name} 延迟${delay}s 执行=${value}`.trim();
		})
		.filter(Boolean)
		.join("；");
}
