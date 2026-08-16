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
 * 管道号下拉选项。
 */
export interface PipeOption {
	label: string;
	value: string;
}

/**
 * 管道配置列表行。
 */
export interface PipelineItem {
	/** 行主键：房间配置 id。 */
	id: number;
	/** 房间配置 id。 */
	configId?: number;
	/** 房间 ID（保存必填）。 */
	roomId?: number;
	/** 房间号。 */
	sampleRoom: string;
	/** 管道号（IN）。 */
	pipeIn: string;
	buildingId: number;
}

/**
 * 房间管道配置表单值。
 */
export interface PipelineFormValues {
	/** 房间号。 */
	sampleRoom: string;
	/** 管道号（IN）。 */
	pipeIn: string;
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
}
