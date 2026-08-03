/**
 * 反控规则实体。
 */
export interface IiotControlRule {
	id?: number;
	ruleName?: string;
	description?: string;
	conditionLogic?: string;
	status?: string;
	triggerCount?: number;
	conditions?: IiotControlCondition[];
	actions?: IiotControlAction[];
}

/**
 * 反控触发条件。
 */
export interface IiotControlCondition {
	id?: number;
	ruleId?: number;
	modelId?: string;
	thingId?: string;
	propertyId?: string;
	propertyName?: string;
	operator?: string;
	thresholdValue?: string;
}

/**
 * 反控执行动作。
 */
export interface IiotControlAction {
	id?: number;
	ruleId?: number;
	modelId?: string;
	thingId?: string;
	propertyId?: string;
	propertyName?: string;
	delaySeconds?: number;
	actionValue?: string;
}

/**
 * 反控规则列表查询参数。
 */
export interface ControlRuleListQuery {
	pageNum: number;
	pageSize: number;
	ruleName?: string;
}

/**
 * 反控规则分页响应。
 */
export interface ControlRuleListResponse {
	list: IiotControlRule[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/**
 * 物实例项（things 接口返回）。
 */
export interface DeviceThingItem {
	thing_id?: string;
	thing_name?: string;
	thingId?: string;
	thingName?: string;
	description?: string | null;
	type?: string;
}

/**
 * 物实例列表响应。
 */
export interface DeviceThingsResponse {
	things: DeviceThingItem[];
}

/**
 * 可控属性项。
 */
export interface ControllableProperty {
	property_id?: string;
	property_name?: string;
	propertyId?: string;
	propertyName?: string;
	dataType?: string;
	unit?: string;
}

/**
 * 启停状态变更请求体。
 */
export interface ChangeStatusPayload {
	id: number;
	status: string;
}
