/**
 * 后端操作日志实体。
 */
export interface SysOperLog {
	operId?: number;
	title?: string;
	businessType?: number;
	method?: string;
	requestMethod?: string;
	operatorType?: number;
	operName?: string;
	deptName?: string;
	operUrl?: string;
	operIp?: string;
	operLocation?: string;
	operParam?: string;
	jsonResult?: string;
	status?: number;
	errorMsg?: string;
	operTime?: string;
	costTime?: number;
	createBy?: string;
}

/**
 * 操作日志列表查询参数。
 */
export interface OperLogListQuery {
	pageNum: number;
	pageSize: number;
	operName?: string;
	createBy?: string;
	title?: string;
	searchValue?: string;
	businessType?: number;
	status?: number;
	params?: {
		beginTime?: string;
		endTime?: string;
	};
}

/**
 * 操作日志分页响应。
 */
export interface OperLogListResponse {
	list: SysOperLog[];
	total: number;
	pageNum: number;
	pageSize: number;
}
