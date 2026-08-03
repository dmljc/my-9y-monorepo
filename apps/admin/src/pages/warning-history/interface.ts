/**
 * 告警关联历史数据记录。
 */
export interface WarningHistoryRecord {
	id?: number;
	modelId?: string;
	modelName?: string;
	thingId?: string;
	thingName?: string;
	propertyId?: string;
	propertyName?: string;
	dataType?: string;
	value?: string;
	dataTime?: string;
}

/**
 * 告警关联历史数据查询参数。
 */
export interface WarningHistoryListQuery {
	thingId: string;
	alarmTime: string;
}
