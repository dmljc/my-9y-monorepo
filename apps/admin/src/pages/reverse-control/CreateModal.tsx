import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
	Button,
	Col,
	Form,
	Input,
	InputNumber,
	Modal,
	Row,
	Select,
	Switch,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import styles from "./index.module.css";
import type { ReverseControlRule, RuleFormValues } from "./types";
import {
	createConditionSummary,
	DEFAULT_ACTION,
	DEFAULT_CONDITION,
	DEVICE_OPTIONS,
	OPERATOR_OPTIONS,
	POINT_OPTIONS,
	RELATION_OPTIONS,
} from "./utils";

interface CreateRuleModalProps {
	open: boolean;
	editingRecord: ReverseControlRule | null;
	onCancel: () => void;
	onOk: (values: RuleFormValues) => void;
}

const CreateRuleModal = ({
	open,
	editingRecord,
	onCancel,
	onOk,
}: CreateRuleModalProps) => {
	const [form] = Form.useForm<RuleFormValues>();
	const [submitting, setSubmitting] = useState(false);
	const isEdit = editingRecord !== null;

	const watchedConditionRelation = Form.useWatch("conditionRelation", form);
	const watchedConditions = Form.useWatch("conditions", form);
	const watchedActions = Form.useWatch("actions", form);

	const autoDescription = useMemo(() => {
		if (!watchedConditions?.length && !watchedActions?.length) return "";
		return createConditionSummary({
			conditionRelation: watchedConditionRelation || "all",
			conditions: watchedConditions || [],
			actions: watchedActions || [],
		} as ReverseControlRule);
	}, [watchedConditionRelation, watchedConditions, watchedActions]);

	useEffect(() => {
		if (!open) return;
		if (editingRecord) {
			form.setFieldsValue({
				name: editingRecord.name,
				conditionRelation: editingRecord.conditionRelation,
				conditions: editingRecord.conditions,
				actions: editingRecord.actions,
				enabled: editingRecord.enabled,
			});
		} else {
			form.resetFields();
			form.setFieldsValue({
				enabled: true,
				conditionRelation: "all",
				conditions: [{ ...DEFAULT_CONDITION }],
				actions: [{ ...DEFAULT_ACTION }],
			});
		}
	}, [open, editingRecord, form]);

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			if (!values.conditions?.length) return;
			if (!values.actions?.length) return;
			setSubmitting(true);
			const description = createConditionSummary({
				conditionRelation: values.conditionRelation,
				conditions: values.conditions,
				actions: values.actions,
			} as ReverseControlRule);
			onOk({ ...values, description });
			onCancel();
		} catch {
			// 表单校验失败，不做处理
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑反控规则" : "新增反控规则"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			okText="保存"
			cancelText="取消"
			confirmLoading={submitting}
			destroyOnHidden
			width={920}
		>
			<Form form={form} preserve={false} className={styles.ruleForm}>
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="name"
							label="反控规则名称"
							rules={[
								{ required: true, message: "请输入规则名称" },
							]}
						>
							<Input placeholder="请输入规则名称" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="conditionRelation"
							label="触发条件"
							rules={[
								{ required: true, message: "请选择条件关系" },
							]}
						>
							<Select options={RELATION_OPTIONS} />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={24}>
						<Form.List name="conditions">
							{(fields, { add, remove }) => (
								<div className={styles.ruleSection}>
									{fields.map((field, index) => (
										<div
											key={field.key}
											className={styles.ruleRow}
										>
											<div className={styles.rowTitle}>
												条件{index + 1}
											</div>
											<Form.Item
												name={[
													field.name,
													"deviceName",
												]}
												rules={[
													{
														required: true,
														message: "请选择设备",
													},
												]}
											>
												<Select
													placeholder="请选择设备"
													options={DEVICE_OPTIONS}
												/>
											</Form.Item>
											<Form.Item
												name={[field.name, "pointName"]}
												rules={[
													{
														required: true,
														message:
															"请选择点位名称",
													},
												]}
											>
												<Select
													placeholder="请选择点位名称"
													options={POINT_OPTIONS}
												/>
											</Form.Item>
											<Form.Item
												name={[field.name, "operator"]}
												rules={[
													{
														required: true,
														message:
															"请选择判断关系",
													},
												]}
											>
												<Select
													options={OPERATOR_OPTIONS}
												/>
											</Form.Item>
											<Form.Item
												name={[field.name, "value"]}
												rules={[
													{
														required: true,
														message: "请输入数值",
													},
												]}
											>
												<InputNumber
													placeholder="请输入数值"
													style={{ width: "100%" }}
												/>
											</Form.Item>
											<Button
												type="text"
												danger
												icon={<DeleteOutlined />}
												disabled={fields.length === 1}
												onClick={() =>
													remove(field.name)
												}
											/>
										</div>
									))}
									<Button
										block
										type="dashed"
										icon={<PlusOutlined />}
										onClick={() =>
											add({ ...DEFAULT_CONDITION })
										}
									>
										添加条件
									</Button>
								</div>
							)}
						</Form.List>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={24}>
						<div className={styles.sectionLabel}>执行动作</div>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={24}>
						<Form.List name="actions">
							{(fields, { add, remove }) => (
								<div className={styles.ruleSection}>
									{fields.map((field, index) => (
										<div
											key={field.key}
											className={styles.actionRow}
										>
											<div className={styles.rowTitle}>
												动作{index + 1}
											</div>
											<Form.Item
												name={[
													field.name,
													"deviceName",
												]}
												rules={[
													{
														required: true,
														message: "请选择设备",
													},
												]}
											>
												<Select
													placeholder="请选择设备"
													options={DEVICE_OPTIONS}
												/>
											</Form.Item>
											<Form.Item
												name={[field.name, "pointName"]}
												rules={[
													{
														required: true,
														message:
															"请选择点位名称",
													},
												]}
											>
												<Select
													placeholder="请选择点位名称"
													options={POINT_OPTIONS}
												/>
											</Form.Item>
											<Form.Item
												name={[
													field.name,
													"targetValue",
												]}
												rules={[
													{
														required: true,
														message: "请输入目标值",
													},
												]}
											>
												<InputNumber
													placeholder="请输入目标值"
													style={{ width: "100%" }}
												/>
											</Form.Item>
											<Button
												type="text"
												danger
												icon={<DeleteOutlined />}
												disabled={fields.length === 1}
												onClick={() =>
													remove(field.name)
												}
											/>
										</div>
									))}
									<Button
										block
										type="dashed"
										icon={<PlusOutlined />}
										onClick={() =>
											add({ ...DEFAULT_ACTION })
										}
									>
										添加动作
									</Button>
								</div>
							)}
						</Form.List>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={24}>
						<div className={styles.descRow}>
							<span className={styles.sectionLabel}>
								规则描述
							</span>
							<span className={styles.descText}>
								{autoDescription ||
									"请配置触发条件和执行动作以生成规则描述"}
							</span>
						</div>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={8}>
						<Form.Item
							name="enabled"
							label="启用"
							valuePropName="checked"
						>
							<Switch
								checkedChildren="启用"
								unCheckedChildren="停用"
							/>
						</Form.Item>
					</Col>
				</Row>
			</Form>
		</Modal>
	);
};

export default CreateRuleModal;
export type {
	ConditionRelation,
	ReverseControlRule,
	RuleAction,
	RuleCondition,
	RuleFormValues,
} from "./types";
export type { CreateRuleModalProps };
