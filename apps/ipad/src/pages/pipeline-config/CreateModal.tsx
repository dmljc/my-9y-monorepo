import { Form, Input, Modal, Select } from "antd";
import type { Rule } from "antd/es/form";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import {
	FLOW_RATE_MAX,
	FLOW_RATE_MIN,
	FLOW_RATE_RANGE_MSG,
	getRoomByPipeNo,
	MAX_LENGTH_40,
	PIPE_OPTIONS,
	type PipelineConfigType,
	type PipelineFormValues,
	type PipelineItem,
	sanitizeFlowRateInput,
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

/** 取样房间号 / 房间号校验（房间配置可编辑）。 */
const sampleRoomRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入房间号" },
	{ max: MAX_LENGTH_40, message: `最多输入${MAX_LENGTH_40}个字符` },
];

/** 管道号（IN）校验。 */
const pipeInRules: Rule[] = [{ required: true, message: "请选择管道号" }];

/** 管道号（OUT）校验。 */
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
interface CreateModalProps {
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
 * 新增 / 编辑管道配置弹窗（样式对齐添加设备弹窗）。
 */
const CreateModal = ({
	open,
	configType,
	editingRecord,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<PipelineFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;
	const isRoom = configType === "room";

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue({
				...editingRecord,
				sampleRoom:
					editingRecord.sampleRoom ||
					getRoomByPipeNo(
						isRoom ? editingRecord.pipeIn : editingRecord.pipeOut,
					),
			});
			return;
		}

		form.resetFields();
	}, [open, editingRecord, isRoom]);

	const handlePipeOutChange = (pipeOut: string) => {
		form.setFieldsValue({
			pipeOut,
			sampleRoom: getRoomByPipeNo(pipeOut),
		});
	};

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
			width="calc(600 / 1400 * 100cqw)"
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
						>
							<Input
								placeholder="请输入房间号"
								maxLength={MAX_LENGTH_40}
							/>
						</Form.Item>
						<Form.Item
							name="pipeIn"
							label="管道号（IN）"
							rules={pipeInRules}
						>
							<Select
								showSearch={{ optionFilterProp: "label" }}
								placeholder="请选择管道号"
								options={PIPE_OPTIONS}
								allowClear
							/>
						</Form.Item>
					</>
				) : (
					<>
						<Form.Item
							name="deviceCode"
							label="设备编码"
							rules={deviceCodeRules}
						>
							<Input
								placeholder="请输入编码"
								maxLength={MAX_LENGTH_40}
							/>
						</Form.Item>
						<Form.Item
							name="deviceName"
							label="设备名称"
							rules={deviceNameRules}
						>
							<Input
								placeholder="请输入设备名称"
								maxLength={MAX_LENGTH_40}
							/>
						</Form.Item>
						<Form.Item
							name="pipeOut"
							label="管道号（OUT）"
							rules={pipeOutRules}
						>
							<Select
								showSearch={{ optionFilterProp: "label" }}
								placeholder="请选择管道号"
								options={PIPE_OPTIONS}
								allowClear
								onChange={handlePipeOutChange}
							/>
						</Form.Item>
						<Form.Item name="sampleRoom" label="房间号">
							<Input placeholder="选择管道后自动带出" disabled />
						</Form.Item>
						<Form.Item
							name="flowRate"
							label="流量（L/min）"
							rules={flowRateRules}
							getValueFromEvent={(e) =>
								sanitizeFlowRateInput(e.target.value)
							}
						>
							<Input
								placeholder="请输入流量"
								inputMode="decimal"
							/>
						</Form.Item>
					</>
				)}
			</Form>
		</Modal>
	);
};

export default CreateModal;
