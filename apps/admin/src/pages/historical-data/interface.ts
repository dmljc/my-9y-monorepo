/**
 * 历史数据记录。
 */
export interface HistoricalDataRecord {
	id?: number;
	modelId?: string;
	modelName?: string;
	propertyName?: string;
	propertyId?: string;
	dataType?: string;
	value?: string;
	dataTime?: string;
}

/**
 * 历史数据列表查询参数。
 */
export interface HistoricalDataListQuery {
	thingId: string;
	propertyId?: string;
	startTime?: string;
	endTime?: string;
	pageNum: number;
	pageSize: number;
}
