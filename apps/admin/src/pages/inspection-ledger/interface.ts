/**
 * 设备点检台账实体。
 */
export interface DeviceLedger {
	id?: number;
	deviceCode?: string;
	deviceName?: string;
	deviceType?: string;
	manufacturer?: string;
	building?: string;
	buildingId?: number;
	room?: string;
	cycleValue?: number;
	cycleUnit?: string;
	cycleText?: string;
	lastInspection?: string;
	nextInspection?: string;
	status?: string;
	remark?: string;
	createBy?: string;
	createTime?: string;
	updateBy?: string;
	updateTime?: string;
}

/**
 * 设备台账列表查询参数。
 */
export interface DeviceLedgerListQuery {
	pageNum: number;
	pageSize: number;
	deviceName?: string;
	building?: string;
}

/**
 * 设备台账分页响应。
 */
export interface DeviceLedgerListResponse {
	list: DeviceLedger[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/**
 * 房间列表查询参数。
 */
export interface RoomListQuery {
	buildingId: string;
}

/**
 * 设备统计概览。
 */
export interface DeviceLedgerStats {
	total: number;
	expiringSoon: number;
	overdue: number;
}

/**
 * 新增/编辑设备表单值。
 */
export interface DeviceFormValues {
	deviceCode: string;
	deviceName: string;
	deviceType: string;
	manufacturer: string;
	/** 厂房 ID，用于联动查询房间。 */
	buildingId: string;
	/** 厂房名称，提交台账用。 */
	building: string;
	/** 房间名称，提交台账用。 */
	room: string;
	cycleValue: number;
	cycleUnit: string;
	lastInspection: string;
}
