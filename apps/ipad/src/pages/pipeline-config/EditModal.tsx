import { Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import { deviceCodeRules, deviceNameRules, sampleRoomRules } from "./formRules";
import styles from "./index.module.css";
import type { PipelineFormValues, PipelineItem } from "./utils";

/**
 * 新增 / 编辑管道配置弹窗 props。
 */
interface EditModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 编辑中的记录；新增时为 null。 */
	editingRecord: PipelineItem | null;
	/** 弹窗挂载容器（页面根，便于 cqw 缩放）。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: PipelineFormValues) => Promise<void>;
}

/**
 * 新增 / 编辑管道配置弹窗（样式对齐添加设备弹窗）。
 */
const EditModal = ({
	open,
	editingRecord,
	getContainer,
	onCancel,
	onOk,
}: EditModalProps) => {
	const [form] = Form.useForm<PipelineFormValues>();
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

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			await onOk(values);
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
				<Form.Item
					name="deviceCode"
					label="设备编码"
					rules={deviceCodeRules}
				>
					<Input placeholder="请输入编码" maxLength={40} />
				</Form.Item>
				<Form.Item
					name="deviceName"
					label="设备名称"
					rules={deviceNameRules}
				>
					<Input placeholder="请输入设备名称" maxLength={40} />
				</Form.Item>
				<Form.Item
					name="sampleRoom"
					label="取样房间号"
					rules={sampleRoomRules}
				>
					<Input placeholder="请输入取样房间号" maxLength={40} />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default EditModal;
