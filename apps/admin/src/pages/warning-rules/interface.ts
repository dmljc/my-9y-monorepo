/**
 * 报警规则列表查询参数。
 */
export interface RuleListQuery {
	pageNum: number;
	pageSize: number;
	ruleName?: string;
}

/**
 * 后端报警规则实体。
 */
export interface AlarmRule {
	id?: number;
	ruleName?: string;
	monitorType?: string;
	buildingName?: string;
	roomName?: string;
	deviceName?: string;
	thingId?: string;
	propertyName?: string;
	propertyId?: string;
	thresholdMin?: string;
	thresholdMax?: string;
	levelId?: number;
	levelName?: string;
	levelColor?: string;
	status?: string;
}

/**
 * 后端报警等级实体。
 */
export interface AlarmLevel {
	id?: number;
	levelName?: string;
	color?: string;
}
