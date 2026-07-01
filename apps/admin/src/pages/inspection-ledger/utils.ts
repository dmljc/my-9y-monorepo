import dayjs from "dayjs";
import mockData from "./mockData.json";
import type {
	CycleUnit,
	DeviceFormValues,
	DeviceStats,
	InspectionDevice,
	InspectionStatus,
	StatCard,
	StatCardAssets,
} from "./types";

export type {
	CycleUnit,
	DeviceFormValues,
	DeviceListFilter,
	DeviceStats,
	InspectionDevice,
	InspectionStatus,
	StatCard,
	StatCardAssets,
} from "./types";

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 表单字段长度限制（与设计稿一致） */
export const DEVICE_CODE_MAX_LENGTH = 20;
export const DEVICE_NAME_MAX_LENGTH = 12;
export const MANUFACTURER_MAX_LENGTH = 12;

/** 距离下次点检 ≤ 该天数时标记为「即将到期」 */
export const EXPIRING_SOON_DAYS = 7;

/** 日期存储/展示格式 */
export const DATE_FORMAT = "YYYY-MM-DD";

/** 新增设备表单默认值 */
export const DEFAULT_DEVICE_FORM_VALUES: Pick<
	DeviceFormValues,
	"cycleValue" | "cycleUnit" | "lastInspectionDate"
> = {
	cycleValue: 7,
	cycleUnit: "day",
	lastInspectionDate: dayjs().format(DATE_FORMAT),
};

/** 双列 Form.Item 布局（与全宽 labelCol:4 视觉对齐） */
export const TWIN_FIELD_LABEL_COL = { span: 8 } as const;
export const TWIN_FIELD_WRAPPER_COL = { span: 16 } as const;

export const MOCK_DEVICES: Omit<InspectionDevice, "status">[] =
	mockData as Omit<InspectionDevice, "status">[];

/** 文本字段最大长度校验规则 */
export function maxLengthRule(max: number) {
	return {
		max,
		message: `最多输入${max}个字符`,
	} as const;
}

export const FACTORY_OPTIONS = [
	{ label: "全部", value: "" },
	{ label: "X03", value: "X03" },
	{ label: "X05", value: "X05" },
	{ label: "X12", value: "X12" },
];

export const FACTORY_BUILDING_OPTIONS = [
	{ label: "X03", value: "X03" },
	{ label: "X05", value: "X05" },
	{ label: "X12", value: "X12" },
];

/** 厂房 → 房间选项（后续可改为接口动态加载） */
export const ROOM_OPTIONS_BY_FACTORY: Record<
	string,
	{ label: string; value: string }[]
> = {
	X03: [
		{ label: "101", value: "101" },
		{ label: "103", value: "103" },
		{ label: "104", value: "104" },
		{ label: "107", value: "107" },
		{ label: "109", value: "109" },
		{ label: "111", value: "111" },
		{ label: "113", value: "113" },
	],
	X05: [
		{ label: "201", value: "201" },
		{ label: "202", value: "202" },
		{ label: "203", value: "203" },
		{ label: "204", value: "204" },
		{ label: "205", value: "205" },
		{ label: "206", value: "206" },
	],
	X12: [
		{ label: "102", value: "102" },
		{ label: "105", value: "105" },
		{ label: "106", value: "106" },
		{ label: "108", value: "108" },
		{ label: "110", value: "110" },
		{ label: "112", value: "112" },
	],
};

export const DEVICE_TYPE_OPTIONS = [
	{ label: "泵", value: "pump" },
	{ label: "压缩机", value: "compressor" },
	{ label: "反应釜", value: "reactor" },
	{ label: "传感器", value: "sensor" },
	{ label: "阀门", value: "valve" },
	{ label: "风机", value: "fan" },
	{ label: "控制器", value: "controller" },
	{ label: "电机", value: "motor" },
	{ label: "换热器", value: "heat_exchanger" },
	{ label: "干燥机", value: "dryer" },
	{ label: "过滤器", value: "filter" },
	{ label: "冷却塔", value: "cooling_tower" },
];

export const DEVICE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
	DEVICE_TYPE_OPTIONS.map(({ label, value }) => [value, label]),
);

export const CYCLE_UNIT_OPTIONS = [
	{ label: "天", value: "day" },
	{ label: "月", value: "month" },
];

export const CYCLE_UNIT_LABEL: Record<CycleUnit, string> = {
	day: "天",
	month: "月",
};

export const STATUS_LABEL: Record<InspectionDevice["status"], string> = {
	normal: "正常",
	expiring_soon: "即将到期",
	overdue: "逾期未检",
};

export const STATUS_COLOR: Record<InspectionDevice["status"], string> = {
	normal: "success",
	expiring_soon: "warning",
	overdue: "error",
};

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 根据上次点检日期与周期计算下次点检日期 */
export function calcNextInspectionDate(
	lastInspectionDate: string,
	cycleValue: number,
	cycleUnit: CycleUnit,
): string {
	const base = dayjs(lastInspectionDate);
	if (cycleUnit === "month") {
		return base.add(cycleValue, "month").format(DATE_FORMAT);
	}
	return base.add(cycleValue, "day").format(DATE_FORMAT);
}

/** 根据下次点检日期计算点检状态 */
export function calcInspectionStatus(
	nextInspectionDate: string,
	today = dayjs().format(DATE_FORMAT),
): InspectionStatus {
	if (nextInspectionDate < today) return "overdue";
	const diffDays = dayjs(nextInspectionDate).diff(dayjs(today), "day");
	if (diffDays <= EXPIRING_SOON_DAYS) return "expiring_soon";
	return "normal";
}

/** 补全设备状态字段（status 由 nextInspectionDate 派生，不持久化存储） */
export function enrichDevice(
	device: Omit<InspectionDevice, "status">,
): InspectionDevice {
	return {
		...device,
		status: calcInspectionStatus(device.nextInspectionDate),
	};
}

/** 格式化点检周期展示文案 */
export function formatCycleText(
	cycleValue: number,
	cycleUnit: CycleUnit,
): string {
	return `每${cycleValue}${CYCLE_UNIT_LABEL[cycleUnit]}`;
}

/** 计算顶部统计数据（基于全量设备，不受列表筛选影响） */
export function calcDeviceStats(devices: InspectionDevice[]): DeviceStats {
	return {
		total: devices.length,
		expiringSoon: devices.filter((item) => item.status === "expiring_soon")
			.length,
		overdue: devices.filter((item) => item.status === "overdue").length,
	};
}

/** 从 mock 数据计算统计（首屏占位，接入 API 后移除） */
export function getMockStats(): DeviceStats {
	return calcDeviceStats(MOCK_DEVICES.map(enrichDevice));
}

/** 根据统计数据构建顶部卡片 */
export function buildStatCards(
	stats: DeviceStats,
	assets: StatCardAssets,
): StatCard[] {
	return [
		{
			key: "total",
			title: "设备总数",
			value: stats.total,
			image: assets.totalImg,
			background: assets.blueCircleBg,
			tone: "blue",
		},
		{
			key: "expiringSoon",
			title: "即将到期",
			value: stats.expiringSoon,
			image: assets.expiringImg,
			background: assets.greenCircleBg,
			tone: "orange",
			valueColor: "#fa8c16",
		},
		{
			key: "overdue",
			title: "逾期未检",
			value: stats.overdue,
			image: assets.overdueImg,
			background: assets.greenCircleBg,
			tone: "orange",
			valueColor: "#f5222d",
		},
	];
}

/** 客户端筛选（mock 阶段使用，接入 API 后由服务端筛选） */
export function filterDevices(
	devices: InspectionDevice[],
	deviceName: string,
	factoryBuilding: string,
): InspectionDevice[] {
	const keyword = deviceName.trim().toLowerCase();
	return devices.filter((item) => {
		if (keyword && !item.name.toLowerCase().includes(keyword)) return false;
		if (factoryBuilding && item.factoryBuilding !== factoryBuilding) {
			return false;
		}
		return true;
	});
}

/** 设备编码是否重复 */
export function isDuplicateDeviceCode(
	devices: InspectionDevice[],
	code: string,
	excludeId?: string,
): boolean {
	const normalized = code.trim();
	if (!normalized) return false;
	return devices.some(
		(item) =>
			item.id !== excludeId &&
			item.code.trim().toLowerCase() === normalized.toLowerCase(),
	);
}

/** 设备名称是否重复 */
export function isDuplicateDeviceName(
	devices: InspectionDevice[],
	name: string,
	excludeId?: string,
): boolean {
	const normalized = name.trim();
	if (!normalized) return false;
	return devices.some(
		(item) => item.id !== excludeId && item.name.trim() === normalized,
	);
}

/** 厂家是否重复 */
export function isDuplicateManufacturer(
	devices: InspectionDevice[],
	manufacturer: string,
	excludeId?: string,
): boolean {
	const normalized = manufacturer.trim();
	if (!normalized) return false;
	return devices.some(
		(item) =>
			item.id !== excludeId && item.manufacturer.trim() === normalized,
	);
}

/** 周期数值是否为大于等于 1 的自然数 */
export function isValidCycleValue(value: unknown): boolean {
	return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

/** 表单值转为设备存储结构（提交前统一 trim 与日期计算） */
export function formValuesToDevice(
	values: DeviceFormValues,
): Omit<InspectionDevice, "id" | "status"> {
	const nextInspectionDate = calcNextInspectionDate(
		values.lastInspectionDate,
		values.cycleValue,
		values.cycleUnit,
	);
	return {
		code: values.code.trim(),
		name: values.name.trim(),
		deviceType: values.deviceType,
		manufacturer: values.manufacturer.trim(),
		factoryBuilding: values.factoryBuilding,
		room: values.room,
		cycleValue: values.cycleValue,
		cycleUnit: values.cycleUnit,
		lastInspectionDate: values.lastInspectionDate,
		nextInspectionDate,
	};
}

/** 设备记录 → 表单初始值（编辑回填） */
export function recordToFormValues(record: InspectionDevice): DeviceFormValues {
	return {
		code: record.code,
		name: record.name,
		deviceType: record.deviceType,
		manufacturer: record.manufacturer,
		factoryBuilding: record.factoryBuilding,
		room: record.room,
		cycleValue: record.cycleValue,
		cycleUnit: record.cycleUnit,
		lastInspectionDate: record.lastInspectionDate,
	};
}

/** 将表单/接口中的日期值规范为 YYYY-MM-DD 字符串 */
export function normalizeDateValue(
	value: string | dayjs.Dayjs | undefined,
): string {
	if (!value) return "";
	return typeof value === "string" ? value : value.format(DATE_FORMAT);
}
