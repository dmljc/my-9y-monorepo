import { Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import type { OrgFormValues, OrgTreeNode } from "./utils";
import {
	getAllOrgs,
	getParentOptions,
	isDuplicateOrgName,
	ORG_DESCRIPTION_MAX_LENGTH,
	ORG_NAME_MAX_LENGTH,
	TOP_PARENT_VALUE,
} from "./utils";

const { TextArea } = Input;

interface CreateModalProps {
	open: boolean;
	editingRecord: OrgTreeNode | null;
	onCancel: () => void;
	onOk: (values: OrgFormValues) => Promise<void>;
}

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<OrgFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;
	const parentOptions = getParentOptions(getAllOrgs(), editingRecord?.deptId);

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue({
				...editingRecord,
				parentId: editingRecord.parentId ?? TOP_PARENT_VALUE,
			});
			return;
		}

		form.resetFields();
		form.setFieldsValue({ parentId: TOP_PARENT_VALUE });
	}, [open, editingRecord]);

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			await onOkProp(values);
			onCancel();
		} catch {
			// 表单校验失败或提交失败
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={onOk}
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
					name="deptName"
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
										getAllOrgs(),
										value,
										editingRecord?.deptId,
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
					name="parentId"
					label="上级组织"
					rules={[
						{
							validator: (_, value: number | undefined) => {
								if (value === undefined || value === null) {
									return Promise.reject(
										new Error("请选择上级组织"),
									);
								}
								return Promise.resolve();
							},
						},
					]}
				>
					<Select
						placeholder="请选择上级组织"
						options={parentOptions}
					/>
				</Form.Item>

				<Form.Item
					name="remark"
					label="组织描述"
					rules={[
						{
							max: ORG_DESCRIPTION_MAX_LENGTH,
							message: `最多输入${ORG_DESCRIPTION_MAX_LENGTH}个字符`,
						},
					]}
				>
					<TextArea
						placeholder="请输入组织描述"
						maxLength={ORG_DESCRIPTION_MAX_LENGTH}
						showCount
						rows={3}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
