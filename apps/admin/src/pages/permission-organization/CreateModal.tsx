import { Form, Input, InputNumber, Modal } from "antd";
import { useEffect, useState } from "react";
import type { Organization, OrgFormValues } from "./utils";
import {
	isDuplicateOrgCode,
	isDuplicateOrgName,
	ORG_CODE_MAX_LENGTH,
	ORG_LEADER_MAX_LENGTH,
	ORG_NAME_MAX_LENGTH,
	SORT_ORDER_MAX,
	SORT_ORDER_MIN,
} from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: Organization | null;
	existingOrgs: Organization[];
	onCancel: () => void;
	onOk: (values: OrgFormValues) => void;
}

const CreateModal = ({
	open,
	editingRecord,
	existingOrgs,
	onCancel,
	onOk,
}: CreateModalProps) => {
	const [form] = Form.useForm<OrgFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue({
				name: editingRecord.name,
				code: editingRecord.code,
				parentName: editingRecord.parentName,
				leader: editingRecord.leader,
				sortOrder: editingRecord.sortOrder,
			});
			return;
		}

		form.resetFields();
		form.setFieldsValue({ sortOrder: 1 });
	}, [open, editingRecord, form]);

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			onOk(values);
			onCancel();
		} catch {
			// 表单校验失败
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑组织" : "新增组织"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width={560}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 5 }}
				wrapperCol={{ span: 19 }}
				preserve={false}
			>
				<Form.Item
					name="name"
					label="组织名称"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入组织名称",
						},
						{
							max: ORG_NAME_MAX_LENGTH,
							message: `最多输入${ORG_NAME_MAX_LENGTH}个字符`,
						},
						{
							validator: (_, value: string) => {
								if (
									isDuplicateOrgName(
										existingOrgs,
										value,
										editingRecord?.id,
									)
								) {
									return Promise.reject(
										new Error("组织名称已存在"),
									);
								}
								return Promise.resolve();
							},
						},
					]}
				>
					<Input
						placeholder="请输入组织名称"
						maxLength={ORG_NAME_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="code"
					label="组织编码"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入组织编码",
						},
						{
							max: ORG_CODE_MAX_LENGTH,
							message: `最多输入${ORG_CODE_MAX_LENGTH}个字符`,
						},
						{
							validator: (_, value: string) => {
								if (
									isDuplicateOrgCode(
										existingOrgs,
										value,
										editingRecord?.id,
									)
								) {
									return Promise.reject(
										new Error("组织编码已存在"),
									);
								}
								return Promise.resolve();
							},
						},
					]}
				>
					<Input
						placeholder="请输入组织编码"
						maxLength={ORG_CODE_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Form.Item name="parentName" label="上级组织">
					<Input placeholder="请输入上级组织" />
				</Form.Item>

				<Form.Item
					name="leader"
					label="负责人"
					rules={[
						{
							max: ORG_LEADER_MAX_LENGTH,
							message: `最多输入${ORG_LEADER_MAX_LENGTH}个字符`,
						},
					]}
				>
					<Input
						placeholder="请输入负责人"
						maxLength={ORG_LEADER_MAX_LENGTH}
					/>
				</Form.Item>

				<Form.Item
					name="sortOrder"
					label="排序"
					rules={[
						{ required: true, message: "请输入排序" },
						{
							type: "number",
							min: SORT_ORDER_MIN,
							max: SORT_ORDER_MAX,
							message: `范围 ${SORT_ORDER_MIN}-${SORT_ORDER_MAX}`,
						},
					]}
				>
					<InputNumber
						placeholder="排序号"
						min={SORT_ORDER_MIN}
						max={SORT_ORDER_MAX}
						precision={0}
						style={{ width: "100%" }}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
