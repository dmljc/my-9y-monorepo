import type { Rule } from "antd/es/form";
import type { InspectionDevice } from "./types";
import {
	DEVICE_CODE_MAX_LENGTH,
	DEVICE_NAME_MAX_LENGTH,
	isDuplicateDeviceName,
	isDuplicateManufacturer,
	isValidCycleValue,
	MANUFACTURER_MAX_LENGTH,
	maxLengthRule,
} from "./utils";

/** 必填且不可为纯空格的文本规则 */
export const requiredTrimRule = (message: string): Rule => ({
	required: true,
	whitespace: true,
	message,
});

/** 必选下拉规则 */
export const requiredSelectRule = (message: string): Rule => ({
	required: true,
	message,
});

/** 设备编码校验规则 */
export const deviceCodeRules: Rule[] = [
	requiredTrimRule("请输入设备编码"),
	maxLengthRule(DEVICE_CODE_MAX_LENGTH),
];

/** 设备类型校验规则 */
export const deviceTypeRules: Rule[] = [requiredSelectRule("请选择设备类型")];

/** 构建设备名称校验规则（含唯一性校验，编辑时排除当前记录） */
export const buildDeviceNameRules = (
	existingDevices: InspectionDevice[],
	editingId?: string,
): Rule[] => [
	requiredTrimRule("请输入设备名称"),
	maxLengthRule(DEVICE_NAME_MAX_LENGTH),
	{
		validator: (_, value: string) => {
			if (isDuplicateDeviceName(existingDevices, value, editingId)) {
				return Promise.reject(new Error("设备名称已存在"));
			}
			return Promise.resolve();
		},
	},
];

/** 构建厂家校验规则（含唯一性校验，编辑时排除当前记录） */
export const buildManufacturerRules = (
	existingDevices: InspectionDevice[],
	editingId?: string,
): Rule[] => [
	requiredTrimRule("请输入厂家"),
	maxLengthRule(MANUFACTURER_MAX_LENGTH),
	{
		validator: (_, value: string) => {
			if (isDuplicateManufacturer(existingDevices, value, editingId)) {
				return Promise.reject(new Error("厂家已存在"));
			}
			return Promise.resolve();
		},
	},
];

/** 周期数值：大于等于 1 的自然数 */
export const cycleValueRules: Rule[] = [
	{ required: true, message: "请输入周期数值" },
	{
		validator: (_, value: number) => {
			if (isValidCycleValue(value)) return Promise.resolve();
			return Promise.reject(new Error("请输入大于等于1的自然数"));
		},
	},
];
