import { Form, Input, Modal, Select } from "antd";
import type { Rule } from "antd/es/form";
import { useEffect, useRef, useState } from "react";
import { detail, listThings, lookup } from "./api";
import styles from "./index.module.css";
import type { Device, DeviceFormValues, ThingOption } from "./interface";
import {
	MAX_LENGTH_12,
	MAX_LENGTH_100,
	parseThingIds,
	toThingOptions,
} from "./utils";

/** 物实例远程搜索防抖间隔（毫秒）。 */
const THING_SEARCH_DEBOUNCE_MS = 300;

/** 设备编码校验。 */
const deviceCodeRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入编码" },
	{ max: MAX_LENGTH_100, message: `最多输入${MAX_LENGTH_100}个字符` },
];

/** 设备名称校验。 */
const deviceNameRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入设备名称" },
	{ max: MAX_LENGTH_12, message: `最多输入${MAX_LENGTH_12}个字符` },
];

/** 选择实例校验。 */
const thingIdsRules: Rule[] = [
	{ required: true, type: "array", min: 1, message: "请选择实例" },
];

/**
 * 新增 / 编辑设备弹窗 props。
 */
interface CreateModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 编辑中的记录；新增时为 null。 */
	editingRecord: Device | null;
	/** 弹窗挂载容器（页面根，便于 cqw 缩放）。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: DeviceFormValues) => Promise<void>;
}

/**
 * 新增 / 编辑设备弹窗（蓝湖：添加设备）。
 */
const CreateModal = ({
	open,
	editingRecord,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<DeviceFormValues>();
	const [loading, setLoading] = useState(false);
	const [thingLoading, setThingLoading] = useState(false);
	const [thingOptions, setThingOptions] = useState<ThingOption[]>([]);
	const thingSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const isEdit = editingRecord !== null;

	/** 厂家：新增必填；列表不回传厂家，编辑改为选填。 */
	const manufacturerRules: Rule[] = isEdit
		? [{ max: MAX_LENGTH_12, message: `最多输入${MAX_LENGTH_12}个字符` }]
		: [
				{ required: true, whitespace: true, message: "请输入设备厂家" },
				{
					max: MAX_LENGTH_12,
					message: `最多输入${MAX_LENGTH_12}个字符`,
				},
			];

	const loadThings = async (keyword = "") => {
		setThingLoading(true);
		try {
			const thingsData = await listThings(keyword);
			setThingOptions(toThingOptions(thingsData));
		} catch {
			setThingOptions([]);
		} finally {
			setThingLoading(false);
		}
	};

	const handleThingSearch = (value: string) => {
		if (thingSearchTimerRef.current) {
			clearTimeout(thingSearchTimerRef.current);
		}
		thingSearchTimerRef.current = setTimeout(() => {
			loadThings(value);
		}, THING_SEARCH_DEBOUNCE_MS);
	};

	useEffect(() => {
		if (!open) return;

		const initModal = async () => {
			await loadThings();

			if (editingRecord) {
				form.setFieldsValue({
					deviceCode: editingRecord.deviceCode,
					deviceName: editingRecord.deviceName,
					manufacturer: editingRecord.manufacturer,
					thingIds: parseThingIds(editingRecord.thingId),
				});
				try {
					const data = await detail(editingRecord.id);
					if (!data || typeof data !== "object") return;
					const thingIds = parseThingIds(
						String(data.thingId ?? "").trim(),
					);
					const manufacturer = String(data.manufacturer ?? "").trim();
					const next: Partial<DeviceFormValues> = {};
					if (thingIds.length) next.thingIds = thingIds;
					if (manufacturer) next.manufacturer = manufacturer;
					if (Object.keys(next).length) form.setFieldsValue(next);
					if (thingIds.length) {
						setThingOptions((prev) => {
							const missing = thingIds.filter(
								(id) => !prev.some((item) => item.value === id),
							);
							if (!missing.length) return prev;
							return [
								...prev,
								...missing.map((id) => ({
									value: id,
									label: id,
								})),
							];
						});
					}
				} catch {
					// 详情失败时保留列表行回显，不阻断编辑。
				}
				return;
			}

			form.resetFields();
		};

		initModal();

		return () => {
			if (thingSearchTimerRef.current) {
				clearTimeout(thingSearchTimerRef.current);
			}
		};
	}, [open, editingRecord]);

	const handleLookup = async () => {
		if (isEdit) return;
		const deviceCode = String(
			form.getFieldValue("deviceCode") ?? "",
		).trim();
		if (!deviceCode) return;

		try {
			const data = await lookup(deviceCode);
			if (!data || typeof data !== "object") return;
			const next: Partial<DeviceFormValues> = {};
			if (data.deviceName) next.deviceName = String(data.deviceName);
			if (data.manufacturer)
				next.manufacturer = String(data.manufacturer);
			if (Object.keys(next).length) form.setFieldsValue(next);
		} catch {
			// 未命中时由全局 onError 提示，不阻断录入。
		}
	};

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			await onOkProp(values);
			onCancel();
		} catch (err) {
			if (err && typeof err === "object" && "errorFields" in err) return;
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			className={styles.modal}
			rootClassName={styles.modalRoot}
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			centered
			width="calc(600 / 1400 * 100cqw)"
			getContainer={getContainer}
		>
			<Form
				form={form}
				layout="vertical"
				preserve={false}
				className={styles.form}
			>
				<Form.Item
					name="deviceCode"
					label="设备编码"
					rules={deviceCodeRules}
				>
					<Input
						placeholder="请输入编码"
						maxLength={MAX_LENGTH_100}
						onBlur={() => {
							handleLookup();
						}}
					/>
				</Form.Item>
				<Form.Item
					name="deviceName"
					label="设备名称"
					rules={deviceNameRules}
				>
					<Input
						placeholder="请输入设备名称"
						maxLength={MAX_LENGTH_12}
					/>
				</Form.Item>
				<Form.Item
					name="manufacturer"
					label="设备厂家"
					rules={manufacturerRules}
				>
					<Input
						placeholder="请输入设备厂家"
						maxLength={MAX_LENGTH_12}
					/>
				</Form.Item>
				<Form.Item
					name="thingIds"
					label="选择实例"
					rules={thingIdsRules}
				>
					<Select
						className={styles.thingSelect}
						mode="multiple"
						showSearch={{
							filterOption: false,
							onSearch: handleThingSearch,
						}}
						loading={thingLoading}
						placeholder="请选择实例"
						options={thingOptions}
						allowClear
						maxTagCount="responsive"
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
