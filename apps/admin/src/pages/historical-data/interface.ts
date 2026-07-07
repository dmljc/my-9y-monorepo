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
 * 设备数据列表查询参数。
 */
export interface DeviceDataListQuery {
	pageNum: number;
	pageSize: number;
	modelName?: string;
	propertyName?: string;
	searchValue?: string;
	thingId?: string;
	alarmTime?: string;
	propertyId?: string;
	dataType?: string;
	params?: {
		beginDataTime?: string;
		endDataTime?: string;
	};
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
