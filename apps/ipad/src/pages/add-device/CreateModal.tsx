import { Form, Input, Modal, Select } from "antd";
import type { Rule } from "antd/es/form";
import { useEffect, useState } from "react";
import { detail, listThings, lookup } from "./api";
import styles from "./index.module.css";
import type { Device, DeviceFormValues, ThingOption } from "./interface";
import { MAX_LENGTH_12, MAX_LENGTH_20, toThingOptions } from "./utils";

/** 设备编码校验。 */
const deviceCodeRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入编码" },
	{ max: MAX_LENGTH_20, message: `最多输入${MAX_LENGTH_20}个字符` },
];

/** 设备名称校验。 */
const deviceNameRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入设备名称" },
	{ max: MAX_LENGTH_12, message: `最多输入${MAX_LENGTH_12}个字符` },
];

/** 选择实例校验。 */
const thingIdRules: Rule[] = [{ required: true, message: "请选择实例" }];

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
	const [thingOptions, setThingOptions] = useState<ThingOption[]>([]);
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

	useEffect(() => {
		if (!open) return;

		const initModal = async () => {
			try {
				const thingsData = await listThings();
				setThingOptions(toThingOptions(thingsData));
			} catch {
				setThingOptions([]);
			}

			if (editingRecord) {
				form.setFieldsValue(editingRecord);
				try {
					const data = await detail(editingRecord.id);
					if (!data || typeof data !== "object") return;
					const thingId = String(data.thingId ?? "").trim();
					const manufacturer = String(data.manufacturer ?? "").trim();
					const next: Partial<DeviceFormValues> = {};
					if (thingId) next.thingId = thingId;
					if (manufacturer) next.manufacturer = manufacturer;
					if (Object.keys(next).length) form.setFieldsValue(next);
					if (thingId) {
						setThingOptions((prev) => {
							if (prev.some((item) => item.value === thingId))
								return prev;
							return [
								...prev,
								{ value: thingId, label: thingId },
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
			title={isEdit ? "编辑设备" : "添加设备"}
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
						maxLength={MAX_LENGTH_20}
						disabled={isEdit}
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
				<Form.Item name="thingId" label="选择实例" rules={thingIdRules}>
					<Select
						className={styles.thingSelect}
						showSearch={{ optionFilterProp: "label" }}
						placeholder="请选择实例"
						options={thingOptions}
						allowClear
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
