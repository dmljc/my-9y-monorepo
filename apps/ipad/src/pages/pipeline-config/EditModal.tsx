import type { InputProps } from "antd";
import { Form, Input, Modal } from "antd";
import type { Rule } from "antd/es/form";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import {
	FLOW_RATE_MAX,
	FLOW_RATE_MIN,
	FLOW_RATE_RANGE_MSG,
	MAX_LENGTH_40,
	type PipelineConfigType,
	type PipelineFormValues,
	type PipelineItem,
	sanitizeFlowRateInput,
	sanitizePipeNoInput,
} from "./utils";

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

/** 取样房间号 / 房间号校验。 */
const sampleRoomRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入房间号" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/** 管道号（IN）校验（弹窗：必填 + 仅数字）。 */
const pipeInRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入管道号" },
	{ pattern: /^\d+$/, message: "管道号仅支持数字" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/** 管道号（OUT）校验（弹窗：必填 + 仅数字）。 */
const pipeOutRules: Rule[] = pipeInRules;

/** 流量校验（弹窗：必填 + 0.00～999999.99）。 */
const flowRateRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入流量" },
	{
		pattern: /^\d+(\.\d{1,2})?$/,
		message: FLOW_RATE_RANGE_MSG,
	},
	{
		validator: (_, value: string) => {
			if (!value?.trim()) return Promise.resolve();
			const num = Number(value);
			if (
				Number.isNaN(num) ||
				num < FLOW_RATE_MIN ||
				num > FLOW_RATE_MAX
			) {
				return Promise.reject(new Error(FLOW_RATE_RANGE_MSG));
			}
			return Promise.resolve();
		},
	},
];

/**
 * 新增 / 编辑管道配置弹窗 props。
 */
interface EditModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 当前配置类型（房间 / 设备）。 */
	configType: PipelineConfigType;
	/** 编辑中的记录；新增时为 null。 */
	editingRecord: PipelineItem | null;
	/** 弹窗挂载容器（页面根，便于 cqw 缩放）。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交；返回 false 时保持弹窗打开。 */
	onOk: (values: PipelineFormValues) => Promise<boolean | undefined>;
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
 * 新增 / 编辑管道配置弹窗（样式对齐添加设备弹窗）。
 */
const EditModal = ({
	open,
	configType,
	editingRecord,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: EditModalProps) => {
	const [form] = Form.useForm<PipelineFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;
	const isRoom = configType === "room";

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
			const result = await onOkProp(values);
			if (result === false) return;
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
			width="calc(730 / 1400 * 100cqw)"
			getContainer={getContainer}
		>
			<Form
				form={form}
				layout="vertical"
				preserve={false}
				className={styles.form}
			>
				{isRoom ? (
					<>
						<Form.Item
							name="sampleRoom"
							label="房间号"
							rules={sampleRoomRules}
							help=""
						>
							<FormInput
								fallbackPlaceholder="请输入房间号"
								maxLength={MAX_LENGTH_40}
							/>
						</Form.Item>
						<Form.Item
							name="pipeIn"
							label="管道号（IN）"
							rules={pipeInRules}
							help=""
							getValueFromEvent={(e) =>
								sanitizePipeNoInput(e.target.value)
							}
						>
							<FormInput
								fallbackPlaceholder="请输入管道号"
								maxLength={MAX_LENGTH_40}
								inputMode="numeric"
							/>
						</Form.Item>
					</>
				) : (
					<>
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
							name="pipeOut"
							label="管道号（OUT）"
							rules={pipeOutRules}
							help=""
							getValueFromEvent={(e) =>
								sanitizePipeNoInput(e.target.value)
							}
						>
							<FormInput
								fallbackPlaceholder="请输入管道号"
								maxLength={MAX_LENGTH_40}
								inputMode="numeric"
							/>
						</Form.Item>
						<Form.Item
							name="flowRate"
							label="流量（L/min）"
							rules={flowRateRules}
							help=""
							getValueFromEvent={(e) =>
								sanitizeFlowRateInput(e.target.value)
							}
						>
							<FormInput
								fallbackPlaceholder="请输入流量"
								inputMode="decimal"
							/>
						</Form.Item>
					</>
				)}
			</Form>
		</Modal>
	);
};

export default EditModal;
