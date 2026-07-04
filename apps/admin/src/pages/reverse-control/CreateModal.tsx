// biome-ignore-all format: compact Item
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, InputNumber, Modal, Radio, Row, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import { getControllable, getModels } from "./api";
import styles from "./index.module.css";
import type { IiotControlRule } from "./interface";
import type { RuleFormValues, SelectOption } from "./types";
import * as utils from "./utils";

const Item = Form.Item;

interface CreateModalProps {
	open: boolean;
	editingRecord: IiotControlRule | null;
	onCancel: () => void;
	onOk: (values: RuleFormValues) => Promise<void>;
}

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<RuleFormValues>();
	const [loading, setLoading] = useState(false);
	const [modelOptions, setModelOptions] = useState<SelectOption[]>([]);
	const [propertyOptionsMap, setPropertyOptionsMap] = useState<Record<string, SelectOption[]>>({});
	const isEdit = editingRecord !== null;

	const loadPropertyOptions = async (modelId: string) => {
		if (!modelId) return;
		const data = await getControllable(modelId);
		setPropertyOptionsMap((prev) => ({
			...prev,
			[modelId]: utils.toPropertyOptions(data ?? []),
		}));
	};

	const initModal = async () => {
		const modelsData = await getModels();
		const options = utils.toModelOptions(modelsData?.models ?? []);
		setModelOptions(options);

		if (editingRecord) {
			const formValues = utils.toFormValues(editingRecord);
			form.setFieldsValue(formValues);
			const modelIds = [
				...new Set(
					[
						...(formValues.conditions ?? []).map(
							(item) => item.modelId,
						),
						...(formValues.actions ?? []).map(
							(item) => item.modelId,
						),
					].filter(Boolean) as string[],
				),
			];
			await Promise.all(
				modelIds.map((modelId) => loadPropertyOptions(modelId)),
			);
			return;
		}

		form.resetFields();
		form.setFieldsValue({
			enabled: true,
			conditions: [{ ...utils.DEFAULT_CONDITION }],
			actions: [{ ...utils.DEFAULT_ACTION }],
		});
	};

	useEffect(() => {
		if (!open) {
			setPropertyOptionsMap({});
			return;
		}

		initModal();
	}, [open, editingRecord]);

	const clearPropertyFields = (listName: "conditions" | "actions", fieldName: number) => {
		form.setFieldValue([listName, fieldName, "propertyId"], undefined);
		form.setFieldValue([listName, fieldName, "propertyName"], undefined);
	};

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			if (!values.conditions?.length || !values.actions?.length) return;
			setLoading(true);
			await onOkProp(values);
			onCancel();
		} finally {
			setLoading(false);
		}
	};

	const getPropertyOptions = (modelId?: string, propertyId?: string, propertyName?: string) => {
		if (!modelId) return [];
		return utils.mergeOption(propertyOptionsMap[modelId] ?? [], propertyId, propertyName);
	};

	return (
		<Modal
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width={920}
		>
			<Form form={form} preserve={false} className={styles.ruleForm}>
				<Row gutter={24}>
					<Col span={12}>
						<Item
							name="ruleName"
							label="反控规则名称"
							rules={[
								{ required: true, whitespace: true, message: "请输入规则名称" },
								{ max: 12, message: "最多输入12个汉字" }
							]}>
							<Input
								placeholder="请输入规则名称"
								maxLength={12}
								showCount
							/>
						</Item>
					</Col>
					<Col span={12}>
						<Item
							name="description"
							label="反控规则描述"
							rules={[
								{ required: true, whitespace: true, message: "请输入规则描述" },
								{ max: 18, message: "最多输入18个汉字" }
							]}>
							<Input
								placeholder="请输入规则描述"
								maxLength={18}
								showCount
							/>
						</Item>
					</Col>
				</Row>

				<div className={styles.sectionLabel}>触发条件</div>

				<Form.List name="conditions">
					{(fields, { add, remove }) => (
						<div className={styles.ruleSection}>
							{fields.map((field, index) => (
								<div key={field.key}>
									{index > 0 && (
										<div className={styles.conditionJoin}>
											<Item
												name={[field.name, "joinOperator"]}
												initialValue="and"
												rules={[{ required: true, message: "请选择条件关系" }]}
											>
												<Radio.Group className={styles.joinRadioGroup} options={utils.JOIN_OPTIONS} />
											</Item>
										</div>
									)}
									<div className={styles.ruleRow}>
										<div className={styles.rowTitle}>条件{index + 1}</div>
										<Item
											name={[field.name, "modelId"]}
											rules={[{ required: true, message: "请选择设备" }]}
										>
											<Select
												showSearch={{ optionFilterProp: "label" }}
												placeholder="请选择设备"
												options={modelOptions}
												onChange={(value) => {
													loadPropertyOptions(value);
													clearPropertyFields("conditions", field.name);
												}}
											/>
										</Item>
										<Item
											noStyle
											shouldUpdate={(prev, next) =>
												prev.conditions?.[field.name]?.modelId !==
												next.conditions?.[field.name]?.modelId
											}
										>
											{() => {
												const modelId = form.getFieldValue(["conditions", field.name, "modelId"]);
												const propertyId = form.getFieldValue(["conditions", field.name, "propertyId"]);
												const propertyName = form.getFieldValue(["conditions", field.name, "propertyName"]);
												const propertyOptions = getPropertyOptions(modelId, propertyId, propertyName);
												return (
													<Item
														name={[field.name, "propertyId"]}
														rules={[{ required: true, message: "请选择点位名称" }]}
													>
														<Select
															placeholder="请选择点位名称"
															options={propertyOptions}
															onFocus={() => modelId && loadPropertyOptions(modelId)}
															onChange={(value) =>
																form.setFieldValue(
																	["conditions", field.name, "propertyName"],
																	propertyOptions.find((item) => item.value === value)?.label ?? "",
																)
															}
														/>
													</Item>
												);
											}}
										</Item>
										<Item name={[field.name, "propertyName"]} hidden>
											<Input />
										</Item>
										<Item
											name={[field.name, "operator"]}
											rules={[{ required: true, message: "请选择判断关系" }]}
										>
											<Select options={utils.OPERATOR_OPTIONS} />
										</Item>
										<Item
											name={[field.name, "thresholdValue"]}
											rules={[{ required: true, message: "请输入数值" }]}
										>
											<InputNumber placeholder="请输入数值" />
										</Item>
										<Button
											type="text"
											danger
											icon={<DeleteOutlined />}
											disabled={fields.length === 1}
											onClick={() => remove(field.name)}
										/>
									</div>
								</div>
							))}
							<Button
								block
								type="dashed"
								icon={<PlusOutlined />}
								onClick={() => add({ ...utils.DEFAULT_CONDITION, joinOperator: "and" })}
							>
								添加条件
							</Button>
						</div>
					)}
				</Form.List>

				<div className={styles.sectionLabel}>执行动作</div>

				<Form.List name="actions">
					{(fields, { add, remove }) => (
						<div className={styles.ruleSection}>
							{fields.map((field, index) => (
								<div key={field.key} className={styles.actionRow}>
									<div className={styles.rowTitle}>动作{index + 1}</div>
									<Item
										name={[field.name, "modelId"]}
										rules={[{ required: true, message: "请选择设备" }]}
									>
										<Select
											showSearch={{ optionFilterProp: "label" }}
											placeholder="请选择设备"
											options={modelOptions}
											onChange={(value) => {
												loadPropertyOptions(value);
												clearPropertyFields("actions", field.name);
											}}
										/>
									</Item>
									<Item
										noStyle
										shouldUpdate={(prev, next) =>
											prev.actions?.[field.name]?.modelId !==
											next.actions?.[field.name]?.modelId
										}
									>
										{() => {
											const modelId = form.getFieldValue(["actions", field.name, "modelId"]);
											const propertyId = form.getFieldValue(["actions", field.name, "propertyId"]);
											const propertyName = form.getFieldValue(["actions", field.name, "propertyName"]);
											const propertyOptions = getPropertyOptions(modelId, propertyId, propertyName);
											return (
												<Item
													name={[field.name, "propertyId"]}
													rules={[{ required: true, message: "请选择点位名称" }]}
												>
													<Select
														placeholder="请选择点位名称"
														options={propertyOptions}
														onFocus={() => modelId && loadPropertyOptions(modelId)}
														onChange={(value) =>
															form.setFieldValue(
																["actions", field.name, "propertyName"],
																propertyOptions.find((item) => item.value === value)?.label ?? "",
															)
														}
													/>
												</Item>
											);
										}}
									</Item>
									<Item name={[field.name, "propertyName"]} hidden>
										<Input />
									</Item>
									<Item
										name={[field.name, "delaySeconds"]}
										rules={[
											{ required: true, message: "请输入延迟" },
											{
												type: "number" as const,
												min: 0,
												max: 99.9,
												message: "范围 0-99.9"
											}
										]}>
										<InputNumber
											placeholder="延迟(s)"
											min={0}
											max={99.9}
											step={0.1}
											precision={1}
										/>
									</Item>
									<Item
										name={[field.name, "actionValue"]}
										rules={[{ required: true, message: "请输入数值" }]}
									>
										<InputNumber placeholder="执行数值" />
									</Item>
									<Button
										type="text"
										danger
										icon={<DeleteOutlined />}
										disabled={fields.length === 1}
										onClick={() => remove(field.name)}
									/>
								</div>
							))}
							<Button
								block
								type="dashed"
								icon={<PlusOutlined />}
								onClick={() => add({ ...utils.DEFAULT_ACTION })}
							>
								添加动作
							</Button>
						</div>
					)}
				</Form.List>

				<Item name="enabled" label="启用" valuePropName="checked">
					<Switch checkedChildren="启用" unCheckedChildren="停用" />
				</Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
