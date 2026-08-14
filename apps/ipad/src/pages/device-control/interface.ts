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
	/** 管道编号。 */
	pipelineId?: string;
	manufacturer?: string;
}

/**
 * `/iiot/tablet/device/rooms` 房间行（设备在 devices 数组内）。
 */
export interface RoomDeviceRow {
	roomId?: number;
	room?: string;
	buildingId?: number;
	building?: string;
	/** 房间绑定的管道编号。 */
	pipelineId?: string;
	devices?: RoomDeviceItem[];
}

/**
 * 左侧列表切换：按设备 / 按房间。
 */
export type ListMode = "device" | "room";

/**
 * WebSocket `/api/ws/tablet` 推送的运行参数。
 */
export interface RuntimeParam {
	/** 点位 ID，趋势接口 propertyId 用此字段。 */
	propertyId?: string;
	displayField?: string;
	label?: string;
	value?: string | number;
	unit?: string;
}

/**
 * WebSocket `/api/ws/tablet` 推送中的单台设备（tablet_init / tablet_data）。
 */
export interface TabletWsDevice {
	deviceId?: number;
	deviceCode?: string;
	deviceName?: string;
	/** 0 运行中 / 1 已关闭。 */
	deviceStatus?: string | number;
	/** 0 空闲 / 1 清洗中。 */
	cleanStatus?: string | number;
	/** 运行参数；右侧指标卡按该数组动态渲染。 */
	runtimeParams?: RuntimeParam[];
	/** 管道编号。 */
	pipelineId?: string;
}

/**
 * WebSocket 消息体（tablet_init / tablet_data）。
 * 注意：线上 data 可能是对象，也可能是二次 JSON 字符串；解析见 parseTabletWsMessage。
 */
export interface TabletWsMessage {
	topic?: string;
	data?: {
		devices?: TabletWsDevice[];
	};
}

/**
 * 详情区实时指标卡（完全由 WS runtimeParams 驱动）。
 */
export interface DeviceMetric {
	key: string;
	/** WS `runtimeParams.propertyId`，趋势查询用。 */
	propertyId: string;
	label: string;
	value: number | null;
	unit: string;
	/** 非数字时的原始文案（如原因描述）。 */
	textValue?: string;
}

/**
 * 设备控制页列表/详情模型。
 */
export interface DeviceItem {
	id: number;
	/** rooms 接口 `devices[].deviceId`，趋势 / 开关 / 清洗用。 */
	deviceId: number;
	code: string;
	name: string;
	roomLabel: string;
	roomId: number;
	/** 管道编号。 */
	pipeNo: string;
	/** 配置流速（接口原值）。 */
	flowRate: number | null;
	manufacturer: string;
	/** 开关：deviceStatus === "0"。 */
	enabled: boolean;
	/** 清洗中：cleanStatus === "1"。 */
	cleaning: boolean;
	buildingId: number;
	thingId: string;
	/** 实时指标（来自 WebSocket runtimeParams）。 */
	metrics: DeviceMetric[];
}

/**
 * 设备历史趋势查询参数。
 */
export interface DeviceTrendQuery {
	/** 设备 ID（路径参数，取 rooms `devices[].deviceId`）。 */
	deviceId: number;
	/** 点位 ID（WS `runtimeParams.propertyId`）。 */
	propertyId: string;
	/** 开始时间戳（毫秒）。 */
	from: number;
	/** 结束时间戳（毫秒）。 */
	to: number;
}

/**
 * 按房间查询点位历史趋势。
 */
export interface RoomTrendQuery {
	/** 厂房 ID。 */
	buildingId: number;
	/** 房间 ID。 */
	roomId: number;
	/** 点位 ID（WS `runtimeParams.propertyId`）。 */
	propertyId: string;
	/** 开始时间戳（毫秒）。 */
	from: number;
	/** 结束时间戳（毫秒）。 */
	to: number;
}

/**
 * 房间折线一条设备序列。
 */
export interface RoomTrendSeriesItem {
	/** 图例名称（设备名称）。 */
	name: string;
	/** 折线颜色。 */
	color: string;
	/** 时序点。 */
	data: { time: number; value: number }[];
}

/**
 * 趋势折线数据点。
 */
export interface DeviceTrendPoint {
	/** 时间戳（毫秒）。 */
	time: number;
	/** 点位数值。 */
	value: number;
}

/**
 * 按设备折线图数据。
 */
export interface DeviceTrendChartData {
	xAxisData: string[];
	yAxisData: number[];
	yAxis: {
		min: number;
		max: number;
		interval?: number;
	};
}

/**
 * 按房间聚合后的列表项。
 */
export interface RoomGroup {
	/** 列表 key（优先 roomId）。 */
	key: string;
	roomId: number;
	roomLabel: string;
	pipeNo: string;
	devices: DeviceItem[];
}
