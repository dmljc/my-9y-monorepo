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
 * `/iiot/tablet/device/rooms` 中单台设备。
 */
export interface RoomDeviceItem {
	deviceId?: number;
	deviceCode?: string;
	deviceName?: string;
	thingId?: string;
	/** 0 运行中 / 1 已关闭。 */
	deviceStatus?: string;
	/** 0 空闲 / 1 清洗中。 */
	cleanStatus?: string;
	cleanStartTime?: string | null;
	flowRate?: number;
}

/**
 * `/iiot/tablet/device/rooms` 房间行（设备在 devices 数组内）。
 */
export interface RoomDeviceRow {
	roomId?: number;
	room?: string;
	buildingId?: number;
	building?: string;
	devices?: RoomDeviceItem[];
}

/**
 * WebSocket `/api/ws/tablet` 推送的运行参数。
 */
export interface RuntimeParam {
	displayField?: string;
	label?: string;
	value?: string | number;
	unit?: string;
}

/**
 * WebSocket 推送中的单台设备。
 */
export interface TabletWsDevice {
	deviceId?: number;
	deviceCode?: string;
	deviceName?: string;
	/** 0 运行中 / 1 已关闭。 */
	deviceStatus?: string | number;
	/** 0 空闲 / 1 清洗中。 */
	cleanStatus?: string | number;
	runtimeParams?: RuntimeParam[];
}

/**
 * WebSocket 消息体（tablet_init / tablet_data）。
 */
export interface TabletWsMessage {
	topic?: string;
	data?: {
		devices?: TabletWsDevice[];
	};
}

/**
 * 详情区实时指标卡。
 */
export interface DeviceMetric {
	key: string;
	label: string;
	value: number | null;
	unit: string;
}

/**
 * 设备控制页列表/详情模型。
 */
export interface DeviceItem {
	id: number;
	code: string;
	name: string;
	roomLabel: string;
	/** 开关：deviceStatus === "0"。 */
	enabled: boolean;
	/** 清洗中：cleanStatus === "1"。 */
	cleaning: boolean;
	buildingId: number;
	thingId: string;
	/** 实时指标（来自 WebSocket runtimeParams）。 */
	metrics: DeviceMetric[];
}
