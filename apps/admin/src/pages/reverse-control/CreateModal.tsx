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
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import type { ReverseControlRule, RuleFormValues } from "./types";
import {
	ACTION_DELAY_MAX,
	ACTION_DELAY_MIN,
	DEFAULT_ACTION,
	DEFAULT_CONDITION,
	DEVICE_OPTIONS,
	deriveConditionRelation,
	isDuplicateRuleName,
	normalizeConditionsForForm,
	OPERATOR_OPTIONS,
	POINT_OPTIONS,
	RULE_DESCRIPTION_MAX_LENGTH,
	RULE_NAME_MAX_LENGTH,
} from "./utils";

interface CreateRuleModalProps {
	open: boolean;
	editingRecord: ReverseControlRule | null;
	existingRules: ReverseControlRule[];
	onCancel: () => void;
	onOk: (values: RuleFormValues) => void;
}

const CreateRuleModal = ({
	open,
	editingRecord,
	existingRules,
	onCancel,
	onOk,
}: CreateRuleModalProps) => {
	const [form] = Form.useForm<RuleFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	const conditions = Form.useWatch("conditions", form);

	useEffect(() => {
		if (!open) return;
		if (editingRecord) {
			form.setFieldsValue({
				name: editingRecord.name,
				description: editingRecord.description,
				conditions: normalizeConditionsForForm(
					editingRecord.conditions,
					editingRecord.conditionRelation,
				).map((item) => ({ ...item })),
				actions: editingRecord.actions.map((item) => ({
					...item,
					delay: item.delay ?? 0,
				})),
				enabled: editingRecord.enabled,
			});
			return;
		}

		form.resetFields();
		form.setFieldsValue({
			enabled: true,
			conditions: [{ ...DEFAULT_CONDITION }],
			actions: [{ ...DEFAULT_ACTION }],
		});
	}, [open, editingRecord, form]);

	const toggleConditionJoin = (conditionIndex: number) => {
		const currentConditions: RuleFormValues["conditions"] =
			form.getFieldValue("conditions") ?? [];
		const currentJoin =
			currentConditions[conditionIndex]?.joinOperator ?? "and";
		form.setFieldsValue({
			conditions: currentConditions.map((item, index) =>
				index === conditionIndex
					? {
							...item,
							joinOperator:
								currentJoin === "and" ? "or" : "and",
						}
					: item,
			),
		});
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			if (!values.conditions?.length || !values.actions?.length) return;
			setLoading(true);
			onOk({
				...values,
				conditionRelation: deriveConditionRelation(values.conditions),
			});
			onCancel();
		} catch {
			// 表单校验失败，不做处理
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑反控规则" : "创建反控规则"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			okText="保存"
			cancelText="取消"
			confirmLoading={loading}
			destroyOnHidden
			width={920}
		>
			<Form form={form} preserve={false} className={styles.ruleForm}>
				<Row gutter={24}>
					<Col span={24}>
						<Form.Item
							name="name"
							label="反控规则名称"
							rules={[
								{ required: true, message: "请输入规则名称" },
								{
									max: RULE_NAME_MAX_LENGTH,
									message: `最多输入${RULE_NAME_MAX_LENGTH}个汉字`,
								},
								{
									validator: (_, value: string) => {
										if (
											isDuplicateRuleName(
												existingRules,
												value,
												editingRecord?.id,
											)
										) {
											return Promise.reject(
												new Error("规则名称已存在"),
											);
										}
										return Promise.resolve();
									},
								},
							]}
						>
							<Input
								placeholder="请输入规则名称"
								maxLength={RULE_NAME_MAX_LENGTH}
								showCount
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={24}>
						<Form.Item
							name="description"
							label="反控规则描述"
							rules={[
								{ required: true, message: "请输入规则描述" },
								{
									max: RULE_DESCRIPTION_MAX_LENGTH,
									message: `最多输入${RULE_DESCRIPTION_MAX_LENGTH}个汉字`,
								},
							]}
						>
							<Input
								placeholder="请输入规则描述"
								maxLength={RULE_DESCRIPTION_MAX_LENGTH}
								showCount
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={24}>
						<div className={styles.sectionLabel}>触发条件</div>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={24}>
						<Form.List name="conditions">
							{(fields, { add, remove }) => (
								<div className={styles.ruleSection}>
									{fields.map((field, index) => (
										<div key={field.key}>
											{index > 0 && (
												<div
													className={
														styles.conditionJoin
													}
												>
													<Form.Item
														name={[
															field.name,
															"joinOperator",
														]}
														hidden
													>
														<input type="hidden" />
													</Form.Item>
													<Button
														type="link"
														onClick={() =>
															toggleConditionJoin(
																index,
															)
														}
													>
														{(conditions?.[index]
															?.joinOperator ??
															"and") === "and"
															? "and"
															: "or"}
													</Button>
												</div>
											)}
											<div className={styles.ruleRow}>
												<div
													className={styles.rowTitle}
												>
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
															message:
																"请选择设备",
														},
													]}
												>
													<Select
														showSearch
														optionFilterProp="label"
														placeholder="请选择设备"
														options={DEVICE_OPTIONS}
													/>
												</Form.Item>
												<Form.Item
													name={[
														field.name,
														"pointName",
													]}
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
														"operator",
													]}
													rules={[
														{
															required: true,
															message:
																"请选择判断关系",
														},
													]}
												>
													<Select
														options={
															OPERATOR_OPTIONS
														}
													/>
												</Form.Item>
												<Form.Item
													name={[field.name, "value"]}
													rules={[
														{
															required: true,
															message:
																"请输入数值",
														},
													]}
												>
													<InputNumber
														placeholder="请输入数值"
														style={{
															width: "100%",
														}}
													/>
												</Form.Item>
												<Button
													type="text"
													danger
													icon={<DeleteOutlined />}
													disabled={
														fields.length === 1
													}
													onClick={() =>
														remove(field.name)
													}
												/>
											</div>
										</div>
									))}
									<Button
										block
										type="dashed"
										icon={<PlusOutlined />}
										onClick={() =>
											add({
												...DEFAULT_CONDITION,
												joinOperator: "and",
											})
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
													showSearch
													optionFilterProp="label"
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
												name={[field.name, "delay"]}
												rules={[
													{
														required: true,
														message: "请输入延迟",
													},
													{
														type: "number",
														min: ACTION_DELAY_MIN,
														max: ACTION_DELAY_MAX,
														message: `范围 ${ACTION_DELAY_MIN}-${ACTION_DELAY_MAX}`,
													},
												]}
											>
												<InputNumber
													placeholder="延迟(s)"
													min={ACTION_DELAY_MIN}
													max={ACTION_DELAY_MAX}
													step={0.1}
													precision={1}
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
														message: "请输入数值",
													},
												]}
											>
												<InputNumber placeholder="执行数值" />
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
