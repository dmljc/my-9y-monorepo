/**
 * 后端设备数据快照实体。
 */
export interface DeviceDataSnapshot {
	id?: number;
	thingId?: string;
	modelId?: string;
	modelName?: string;
	propertyName?: string;
	propertyId?: string;
	dataType?: string;
	value?: string;
	dataTime?: string;
}

/**
 * 历史数据查询参数（GET /iiot/device-data/history）。
 */
export interface DeviceDataHistoryQuery {
	pageNum: number;
	pageSize: number;
	thingId?: string;
	modelName?: string;
	propertyName?: string;
	propertyId?: string;
	startTime?: string;
	endTime?: string;
	/** 告警上下文跳转时使用，走 /iiot/alarm/context-data。 */
	alarmTime?: string;
}

/**
 * 设备数据分页响应。
 */
export interface DeviceDataListResponse {
	list: DeviceDataSnapshot[];
	total: number;
	pageNum: number;
	pageSize: number;
}
