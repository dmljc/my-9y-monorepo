import { CheckOutlined } from "@ant-design/icons";
import { ColorPicker, Form, Input, Modal } from "antd";
import type { AggregationColor } from "antd/es/color-picker/color";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import {
	COLOR_PRESET_ITEMS,
	DEFAULT_COLOR,
	type LevelFormValues,
	type WarningLevel,
} from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: WarningLevel | null;
	onCancel: () => void;
	onSubmit: (values: LevelFormValues) => Promise<void>;
}

function normalizeHex(color: string) {
	return color.trim().toLowerCase();
}

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onSubmit,
}: CreateModalProps) => {
	const [form] = Form.useForm<LevelFormValues>();
	const [loading, setLoading] = useState(false);
	const selectedColor = Form.useWatch("color", form);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue(editingRecord);
			return;
		}

		form.resetFields();
		form.setFieldsValue({ color: DEFAULT_COLOR });
	}, [open, editingRecord]);

	const onOk = async () => {
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

	const handlePresetSelect = (color: string) => {
		form.setFieldValue("color", color);
	};

	return (
		<Modal
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={onOk}
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
						color.toHexString().toUpperCase()
					}
				>
					<ColorPicker
						showText
						format="hex"
						styles={{ popup: { root: { width: 280 } } }}
						panelRender={(_, { components: { Picker } }) => (
							<div className={styles.colorPanel}>
								<div className={styles.colorPickerPanel}>
									<Picker />
								</div>
								<div className={styles.colorPresets}>
									<div className={styles.presetTitle}>
										自定义颜色面板
									</div>
									<div className={styles.presetList}>
										{COLOR_PRESET_ITEMS.map((item) => {
											const active =
												normalizeHex(
													selectedColor ?? "",
												) === normalizeHex(item.color);
											return (
												<button
													key={item.color}
													type="button"
													className={
														styles.presetItem
													}
													onClick={() =>
														handlePresetSelect(
															item.color,
														)
													}
												>
													<span
														className={`${styles.presetSwatch}${active ? ` ${styles.presetSwatchActive}` : ""}`}
														style={{
															backgroundColor:
																item.color,
														}}
													>
														{active ? (
															<CheckOutlined
																className={
																	styles.presetCheck
																}
															/>
														) : null}
													</span>
													<span
														className={
															styles.presetLevel
														}
													>
														{item.name}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							</div>
						)}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
