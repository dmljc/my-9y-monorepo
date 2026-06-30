import { ColorPicker, Form, Input, Modal } from "antd";
import type { AggregationColor } from "antd/es/color-picker/color";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import type { LevelFormValues, WarningLevel } from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: WarningLevel | null;
	onCancel: () => void;
	onSubmit: (values: LevelFormValues) => Promise<void>;
}

const DEFAULT_COLOR = "#1677ff";

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onSubmit,
}: CreateModalProps) => {
	const [form] = Form.useForm<LevelFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue({
				name: editingRecord.name,
				color: editingRecord.color,
			});
			return;
		}

		form.resetFields();
		form.setFieldsValue({ color: DEFAULT_COLOR });
	}, [open, editingRecord]);

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			await onSubmit(values);
			onCancel();
		} catch (err) {
			if (err && typeof err === "object" && "errorFields" in err) return;
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑等级" : "新增等级"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width={480}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 5 }}
				wrapperCol={{ span: 19 }}
				preserve={false}
				className={styles.levelForm}
			>
				<Form.Item
					name="name"
					label="等级名称"
					rules={[{ required: true, message: "请输入等级名称" }]}
				>
					<Input placeholder="请输入等级名称" />
				</Form.Item>

				<Form.Item
					name="color"
					label="颜色"
					rules={[{ required: true, message: "请选择颜色" }]}
					getValueFromEvent={(color: AggregationColor) =>
						color.toHexString()
					}
				>
					<ColorPicker showText format="hex" />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
