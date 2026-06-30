// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 单个控制点位 */
export interface ControlPoint {
	id: string;
	name: string;
}

/** 设备分组（含多个点位） */
export interface DeviceGroup {
	id: string;
	name: string;
	points: ControlPoint[];
}

/** 厂区面板 */
export interface FactoryPanel {
	key: string;
	label: string;
	location: string;
	devices: DeviceGroup[];
}

/** 控制点位开关状态映射（点位 ID → 是否开启） */
export type ControlState = Record<string, boolean>;

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 根据厂区面板数据构建初始开关状态（全部关闭）
 */
export function buildInitialState(panels: FactoryPanel[]): ControlState {
	return panels.reduce<ControlState>((state, factory) => {
		factory.devices.forEach((device) => {
			device.points.forEach((point) => {
				state[point.id] = false;
			});
		});
		return state;
	}, {});
}

/**
 * 获取厂区内所有点位 ID 列表
 */
export function getPointIds(panel: FactoryPanel): string[] {
	return panel.devices.flatMap((device) =>
		device.points.map((point) => point.id),
	);
}

/**
 * 统计厂区中已开启的点位数量
 */
export function countEnabledPoints(
	panel: FactoryPanel,
	controlState: ControlState,
): number {
	return panel.devices
		.flatMap((device) => device.points)
		.filter((point) => controlState[point.id]).length;
}

/**
 * 统计厂区总点位数量
 */
export function countTotalPoints(panel: FactoryPanel): number {
	return panel.devices.reduce(
		(total, device) => total + device.points.length,
		0,
	);
}
