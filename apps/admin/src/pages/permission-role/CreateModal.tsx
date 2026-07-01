import { Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import type { Role, RoleFormValues } from "./utils";
import {
	isDuplicateRoleName,
	ROLE_DESCRIPTION_MAX_LENGTH,
	ROLE_NAME_MAX_LENGTH,
} from "./utils";

const { TextArea } = Input;

interface CreateModalProps {
	open: boolean;
	existingRoles: Role[];
	onCancel: () => void;
	onOk: (values: RoleFormValues) => void;
}

const CreateModal = ({
	open,
	existingRoles,
	onCancel,
	onOk,
}: CreateModalProps) => {
	const [form] = Form.useForm<RoleFormValues>();
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		form.resetFields();
	}, [open, form]);

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
			title="添加角色"
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
					label="角色名称"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入角色名称",
						},
						{
							max: ROLE_NAME_MAX_LENGTH,
							message: `最多输入${ROLE_NAME_MAX_LENGTH}个字符`,
						},
						{
							validator: (_, value: string) => {
								if (isDuplicateRoleName(existingRoles, value)) {
									return Promise.reject(
										new Error("角色名称已存在"),
									);
								}
								return Promise.resolve();
							},
						},
					]}
				>
					<Input
						placeholder="请输入角色名称"
						maxLength={ROLE_NAME_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="description"
					label="角色描述"
					rules={[
						{
							max: ROLE_DESCRIPTION_MAX_LENGTH,
							message: `最多输入${ROLE_DESCRIPTION_MAX_LENGTH}个字符`,
						},
					]}
				>
					<TextArea
						placeholder="请输入角色描述"
						maxLength={ROLE_DESCRIPTION_MAX_LENGTH}
						showCount
						rows={3}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
