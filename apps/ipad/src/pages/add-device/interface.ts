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
 * 设备运行状态（与后端 deviceStatus 对应：0 运行中 / 1 已关闭）。
 */
export type DeviceStatus = "running" | "closed";

/**
 * 添加设备列表行（对齐 `/iiot/tablet/ledger/list` 精简字段）。
 */
export interface Device {
	id: number;
	deviceCode: string;
	deviceName: string;
	/** 列表/详情当前不返回厂家，编辑时可能为空。 */
	manufacturer: string;
	/** 物实例 ID；列表精简字段可能为空。 */
	thingId: string;
	sampleRoom: string;
	status: DeviceStatus;
	buildingId: number;
	deviceType?: string;
	deviceStatus: string;
}

/**
 * 新增 / 编辑表单值。
 */
export interface DeviceFormValues {
	deviceCode: string;
	deviceName: string;
	manufacturer: string;
	/** 物实例 ID。 */
	thingId: string;
}

/**
 * 选择实例下拉选项。
 */
export interface ThingOption {
	label: string;
	value: string;
}

/**
 * 列表行 / 详情（对齐 IiotTabletDevice 精简返回）。
 */
export interface TabletDeviceRow {
	id?: number;
	deviceCode?: string;
	deviceName?: string;
	manufacturer?: string;
	building?: string;
	buildingId?: number;
	room?: string;
	deviceType?: string;
	deviceStatus?: string;
	thingId?: string;
	pipelineId?: string;
}

/**
 * 新增 / 编辑提交体。
 */
export interface TabletDevicePayload {
	id?: number;
	deviceCode: string;
	deviceName: string;
	manufacturer?: string;
	/** 物实例 ID（IIoT 平台）。 */
	thingId?: string;
	building?: string;
	buildingId: number;
	deviceStatus?: string;
	deviceType?: string;
	room?: string;
}
