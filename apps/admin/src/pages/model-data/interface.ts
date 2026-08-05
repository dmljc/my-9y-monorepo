/**
 * 后端设备数据快照实体。
 */
export interface DeviceDataSnapshot {
	id?: number;
	thingId?: string;
	thingName?: string;
	modelId?: string;
	modelName?: string;
	propertyName?: string;
	propertyId?: string;
	dataType?: string;
	value?: string;
	dataTime?: string;
}

/**
 * 设备数据列表查询参数（GET /iiot/device-data/list）。
 */
export interface DeviceDataListQuery {
	pageNum: number;
	pageSize: number;
	modelName?: string;
	thingName?: string;
	propertyName?: string;
}
