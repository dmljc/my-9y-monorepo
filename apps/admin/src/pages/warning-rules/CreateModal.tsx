import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import type { RuleFormValues, WarningRule } from "./utils";
import {
	DEVICE_OPTIONS,
	MONITOR_TYPE_OPTIONS,
	type MonitorType,
	PROPERTY_OPTIONS,
	ROOM_OPTIONS,
	RULE_LEVEL_OPTIONS,
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
	const [submitting, setSubmitting] = useState(false);
	const isEdit = editingRecord !== null;

	const monitorType = Form.useWatch("monitorType", form) as
		| MonitorType
		| undefined;

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue({
				name: editingRecord.name,
				monitorType: editingRecord.monitorType,
				targetName: editingRecord.targetName,
				propertyKey: editingRecord.propertyKey,
				thresholdMin: editingRecord.thresholdMin,
				thresholdMax: editingRecord.thresholdMax,
				level: editingRecord.level,
				enabled: editingRecord.enabled,
			});
			return;
		}

		form.resetFields();
		form.setFieldsValue({
			monitorType: "device",
			level: "urgent",
			enabled: true,
		});
	}, [open, editingRecord, form]);

	const handleMonitorTypeChange = () => {
		form.setFieldValue("targetName", undefined);
		form.setFieldValue("propertyKey", undefined);
	};

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

			setSubmitting(true);
			await onSubmit(values);
			onCancel();
		} catch (err) {
			if (err && typeof err === "object" && "errorFields" in err) return;
		} finally {
			setSubmitting(false);
		}
	};

	const targetOptions =
		monitorType === "room" ? ROOM_OPTIONS : DEVICE_OPTIONS;
	const targetLabel = monitorType === "room" ? "房间名称" : "设备名称";

	return (
		<Modal
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={submitting}
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
					rules={[{ required: true, message: "请输入规则名称" }]}
				>
					<Input placeholder="请输入规则名称" />
				</Form.Item>

				<Form.Item
					name="monitorType"
					label="监控类型"
					rules={[{ required: true, message: "请选择监控对象" }]}
				>
					<Select
						options={MONITOR_TYPE_OPTIONS}
						onChange={handleMonitorTypeChange}
					/>
				</Form.Item>

				<Form.Item
					name="targetName"
					label={targetLabel}
					rules={[
						{
							required: true,
							message: `请选择${targetLabel}`,
						},
					]}
				>
					<Select
						placeholder={`请选择${targetLabel}`}
						options={targetOptions}
						allowClear
					/>
				</Form.Item>

				<Form.Item
					name="propertyKey"
					label="物模型属性"
					rules={[{ required: true, message: "请选择物模型属性" }]}
				>
					<Select
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
							rules={[{ required: true, message: "请输入下限" }]}
						>
							<InputNumber
								className={styles.thresholdInput}
								placeholder="下限"
							/>
						</Form.Item>
						<span className={styles.thresholdDivider}>-</span>
						<Form.Item
							name="thresholdMax"
							noStyle
							rules={[{ required: true, message: "请输入上限" }]}
						>
							<InputNumber
								className={styles.thresholdInput}
								placeholder="上限"
							/>
						</Form.Item>
					</div>
				</Form.Item>

				<Form.Item
					name="level"
					label="绑定等级"
					rules={[{ required: true, message: "请选择报警等级" }]}
				>
					<Select options={RULE_LEVEL_OPTIONS} />
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
