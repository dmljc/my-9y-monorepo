import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import { listLevels } from "./api";
import styles from "./index.module.css";
import type { RuleFormValues, RuleLevelOption, WarningRule } from "./utils";
import {
	BUILDING_OPTIONS,
	DEVICE_OPTIONS,
	MAX_LENGTH_12,
	PROPERTY_OPTIONS,
	ROOM_OPTIONS,
	THRESHOLD_MAX,
	THRESHOLD_MIN,
	toLevelOptions,
} from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: WarningRule | null;
	onCancel: () => void;
	onSubmit: (values: RuleFormValues) => Promise<void>;
}

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onSubmit,
}: CreateModalProps) => {
	const [form] = Form.useForm<RuleFormValues>();
	const [loading, setLoading] = useState(false);
	const [levelOptions, setLevelOptions] = useState<RuleLevelOption[]>([]);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		const init = async () => {
			const data = await listLevels();
			setLevelOptions(toLevelOptions(data));
		};
		init();

		if (editingRecord) {
			form.setFieldsValue(editingRecord);
			return;
		}

		form.resetFields();
		form.setFieldsValue({
			enabled: true,
		});
	}, [open, editingRecord]);

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			if (values.thresholdMin > values.thresholdMax) {
				form.setFields([
					{
						name: "thresholdMax",
						errors: ["上限不能小于下限"],
					},
				]);
				return;
			}

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
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width={560}
			classNames={{ footer: styles.ruleModalFooter }}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 5 }}
				wrapperCol={{ span: 19 }}
				preserve={false}
				className={styles.ruleForm}
			>
				<Form.Item
					name="name"
					label="规则名称"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入规则名称",
						},
						{
							max: MAX_LENGTH_12,
							message: `最多输入${MAX_LENGTH_12}个字符`,
						},
					]}
				>
					<Input
						maxLength={MAX_LENGTH_12}
						placeholder="请输入规则名称"
						showCount
					/>
				</Form.Item>

				<Form.Item label="所属房间" required>
					<div className={styles.thresholdRange}>
						<Form.Item
							name="buildingNames"
							noStyle
							rules={[
								{
									required: true,
									type: "array",
									min: 1,
									message: "请至少选择一个厂房",
								},
							]}
						>
							<Select
								mode="multiple"
								placeholder="请选择厂房"
								options={BUILDING_OPTIONS}
								allowClear
							/>
						</Form.Item>
						<Form.Item
							name="roomNames"
							noStyle
							rules={[
								{
									required: true,
									type: "array",
									min: 1,
									message: "请至少选择一个房间",
								},
							]}
						>
							<Select
								mode="multiple"
								placeholder="请选择房间"
								options={ROOM_OPTIONS}
								allowClear
							/>
						</Form.Item>
					</div>
				</Form.Item>

				<Form.Item
					name="deviceNames"
					label="设备名称"
					rules={[
						{
							required: true,
							type: "array",
							min: 1,
							message: "请至少选择一个设备",
						},
					]}
				>
					<Select
						mode="multiple"
						placeholder="请选择设备"
						options={DEVICE_OPTIONS}
						allowClear
					/>
				</Form.Item>

				<Form.Item
					name="propertyKeys"
					label="物模型属性"
					rules={[
						{
							required: true,
							type: "array",
							min: 1,
							message: "请至少选择一个属性",
						},
					]}
				>
					<Select
						mode="multiple"
						placeholder="请选择物模型属性"
						options={PROPERTY_OPTIONS}
						allowClear
					/>
				</Form.Item>

				<Form.Item label="报警阈值" required>
					<div className={styles.thresholdRange}>
						<Form.Item
							name="thresholdMin"
							noStyle
							rules={[
								{ required: true, message: "请输入下限" },
								{
									type: "number",
									min: THRESHOLD_MIN,
									max: THRESHOLD_MAX,
									message: `请输入${THRESHOLD_MIN}-${THRESHOLD_MAX}之间的数字`,
								},
							]}
						>
							<InputNumber
								className={styles.thresholdInput}
								placeholder="下限"
								min={THRESHOLD_MIN}
								max={THRESHOLD_MAX}
								precision={2}
							/>
						</Form.Item>
						<span className={styles.thresholdDivider}>-</span>
						<Form.Item
							name="thresholdMax"
							noStyle
							rules={[
								{ required: true, message: "请输入上限" },
								{
									type: "number",
									min: THRESHOLD_MIN,
									max: THRESHOLD_MAX,
									message: `请输入${THRESHOLD_MIN}-${THRESHOLD_MAX}之间的数字`,
								},
							]}
						>
							<InputNumber
								className={styles.thresholdInput}
								placeholder="上限"
								min={THRESHOLD_MIN}
								max={THRESHOLD_MAX}
								precision={2}
							/>
						</Form.Item>
					</div>
				</Form.Item>

				<Form.Item
					name="levelId"
					label="绑定等级"
					rules={[{ required: true, message: "请选择报警等级" }]}
				>
					<Select options={levelOptions} />
				</Form.Item>

				<Form.Item
					name="enabled"
					label="是否启用"
					valuePropName="checked"
				>
					<Switch checkedChildren="启用" unCheckedChildren="停用" />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
