import type { InputProps } from "antd";
import { Form, Input, Modal } from "antd";
import type { Rule } from "antd/es/form";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import { type Device, type FormValues, MAX_LENGTH_40 } from "./utils";

/** 设备编码校验。 */
const deviceCodeRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入编码" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/** 设备名称校验。 */
const deviceNameRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入设备名称" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/** 设备厂家校验。 */
const manufacturerRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入设备厂家" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/**
 * 新增 / 编辑设备弹窗 props。
 */
interface AddDeviceModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 编辑中的记录；新增时为 null。 */
	editingRecord: Device | null;
	/** 弹窗挂载容器（页面根，便于 cqw 缩放）。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: FormValues) => Promise<void>;
}

/**
 * 表单输入框：校验错误文案展示在输入框内（placeholder），不撑高 Form.Item。
 */
const FormInput = ({
	fallbackPlaceholder,
	className,
	...rest
}: InputProps & { fallbackPlaceholder: string }) => {
	const { status, errors } = Form.Item.useStatus();
	const errorText =
		status === "error" && typeof errors[0] === "string" ? errors[0] : "";
	const hasError = Boolean(errorText);

	return (
		<Input
			{...rest}
			status={hasError ? "error" : undefined}
			placeholder={hasError ? errorText : fallbackPlaceholder}
			className={`${className ?? ""} ${hasError ? styles.formInputError : ""}`.trim()}
		/>
	);
};

/**
 * 新增 / 编辑设备弹窗（蓝湖：添加设备）。
 */
const AddDeviceModal = ({
	open,
	editingRecord,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: AddDeviceModalProps) => {
	const [form] = Form.useForm<FormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue(editingRecord);
			return;
		}

		form.resetFields();
	}, [open, editingRecord]);

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
			width="calc(730 / 1400 * 100cqw)"
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
					help=""
				>
					<FormInput
						fallbackPlaceholder="请输入编码"
						maxLength={MAX_LENGTH_40}
					/>
				</Form.Item>
				<Form.Item
					name="deviceName"
					label="设备名称"
					rules={deviceNameRules}
					help=""
				>
					<FormInput
						fallbackPlaceholder="请输入设备名称"
						maxLength={MAX_LENGTH_40}
					/>
				</Form.Item>
				<Form.Item
					name="manufacturer"
					label="设备厂家"
					rules={manufacturerRules}
					help=""
				>
					{/* 蓝湖稿占位为「请输入设备名称」 */}
					<FormInput
						fallbackPlaceholder="请输入设备名称"
						maxLength={MAX_LENGTH_40}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default AddDeviceModal;
