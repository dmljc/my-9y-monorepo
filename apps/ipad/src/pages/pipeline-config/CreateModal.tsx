import { Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import type { PipelineFormValues, PipelineItem } from "./interface";
import { PIPE_IN_OPTIONS } from "./utils";

/**
 * 房间管道配置弹窗 props。
 */
interface CreateModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 编辑中的记录；新增时为 null。 */
	editingRecord: PipelineItem | null;
	/** 弹窗挂载容器。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: PipelineFormValues) => Promise<void>;
}

/**
 * 新增 / 编辑房间管道配置弹窗。
 */
const CreateModal = ({
	open,
	editingRecord,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<PipelineFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) {
			setLoading(false);
			return;
		}
		if (editingRecord) {
			form.setFieldsValue(editingRecord);
			return;
		}
		form.resetFields();
	}, [open, editingRecord, form]);

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
			<Form form={form} layout="vertical" preserve={false} className={styles.form}>
				<Form.Item
					name="sampleRoom"
					label="房间号"
					rules={[
						{ required: true, whitespace: true, message: "请输入房间号" },
						{ max: 50, message: "最多输入50个字符" },
					]}
				>
					<Input placeholder="请输入房间号" allowClear maxLength={50} />
				</Form.Item>
				<Form.Item
					name="pipeIn"
					label="管道号（IN）"
					rules={[{ required: true, message: "请选择管道号" }]}
				>
					<Select
						placeholder="请选择管道号"
						options={PIPE_IN_OPTIONS}
						allowClear
						showSearch={{ optionFilterProp: "label" }}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
