import { Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import {
	deviceCodeRules,
	deviceNameRules,
	MAX_LENGTH_40,
	pipeInRules,
	sampleRoomRules,
} from "./formRules";
import styles from "./index.module.css";
import {
	type PipelineConfigType,
	type PipelineFormValues,
	type PipelineItem,
	sanitizePipeInInput,
} from "./utils";

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
 * 新增 / 编辑管道配置弹窗（样式对齐添加设备弹窗）。
 */
const EditModal = ({
	open,
	configType,
	editingRecord,
	getContainer,
	onCancel,
	onOk,
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

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			const result = await onOk(values);
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
			onOk={handleOk}
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
				requiredMark={false}
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
							getValueFromEvent={(e) =>
								sanitizePipeInInput(e.target.value)
							}
						>
							<Input
								placeholder="请输入管道号"
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
							name="sampleRoom"
							label="取样房间号"
							rules={sampleRoomRules}
						>
							<Input
								placeholder="请输入取样房间号"
								maxLength={MAX_LENGTH_40}
							/>
						</Form.Item>
					</>
				)}
			</Form>
		</Modal>
	);
};

export default EditModal;
