/**
 * 厂房选项（顶栏 Tab）。
 */
export interface BuildingTab {
	/** Tab key，使用 buildingId 字符串。 */
	key: string;
	/** 展示名称。 */
	label: string;
	/** 厂房 ID。 */
	buildingId: number;
	/** 厂房名称。 */
	building: string;
}

/**
 * 管道配置 Tab 类型（房间 / 设备）。
 */
export type PipelineConfigType = "room" | "device";

/**
 * 管道号下拉选项。
 */
export interface PipeOption {
	label: string;
	value: string;
}

/**
 * 管道配置列表行（房间 / 设备共用表格模型）。
 */
export interface PipelineItem {
	/** 行主键：房间为配置 id，设备为 deviceId。 */
	id: number;
	/** 房间配置 id（房间 Tab）。 */
	configId?: number;
	/** 房间 ID（房间 Tab 保存必填）。 */
	roomId?: number;
	/** 设备 ID（设备 Tab；与 id 相同）。 */
	deviceId?: number;
	deviceCode: string;
	deviceName: string;
	/** 房间号。 */
	sampleRoom: string;
	/** 管道号（IN），房间配置使用。 */
	pipeIn: string;
	/** 管道号（OUT），设备配置使用。 */
	pipeOut: string;
	/** 流量（L/min），设备配置使用；以字符串便于受控输入。 */
	flowRate: string;
	buildingId: number;
	configType: PipelineConfigType;
}

/**
 * 房间管道配置行（对齐 IiotPipelineConfig）。
 */
export interface RoomPipelineRow {
	id?: number;
	buildingId?: number;
	roomId?: number;
	room?: string;
	pipelineId?: string;
}

/**
 * 房间-保存管道配置提交体。
 */
export interface RoomPipelinePayload {
	id?: number;
	buildingId: number;
	roomId: number;
	room?: string;
	pipelineId?: string;
}

/**
 * 管道号下拉数据源行（options 接口）。
 */
export interface PipelineOptionRow {
	pipelineId?: string;
	room?: string;
}

/**
 * 设备管道配置行（对齐 device/list 精简字段）。
 */
export interface DevicePipelineRow {
	id?: number;
	deviceCode?: string;
	deviceName?: string;
	pipelineId?: string;
	flowRate?: number | string | null;
	room?: string;
}

/**
 * 设备-保存管道配置 query 参数。
 */
export interface DevicePipelineSaveParams {
	deviceId: number;
	pipelineId?: string;
	flowRate?: number;
}
