import { Form, Input, Modal, TreeSelect } from "antd";
import { useEffect, useState } from "react";
import type { OrgFormValues, OrgTreeNode } from "./utils";
import {
	getAllOrgs,
	getParentTreeData,
	isDuplicateOrgName,
	MAX_LENGTH_30,
	MAX_LENGTH_200,
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
	const parentTreeData = getParentTreeData(
		getAllOrgs(),
		editingRecord?.deptId,
	);

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
							max: MAX_LENGTH_30,
							message: `最多输入${MAX_LENGTH_30}个字符`,
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
						maxLength={MAX_LENGTH_30}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="parentId"
					label="上级组织"
					rules={[{ required: true, message: "请选择上级组织" }]}
				>
					<TreeSelect
						placeholder="请选择上级组织"
						treeData={parentTreeData}
						treeDefaultExpandAll
						showSearch={{ treeNodeFilterProp: "title" }}
					/>
				</Form.Item>

				<Form.Item
					name="remark"
					label="组织描述"
					rules={[
						{
							max: MAX_LENGTH_200,
							message: `最多输入${MAX_LENGTH_200}个字符`,
						},
					]}
				>
					<TextArea
						placeholder="请输入组织描述"
						maxLength={MAX_LENGTH_200}
						showCount
						rows={3}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
