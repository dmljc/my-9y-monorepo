import { Checkbox, Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { getAllUsers } from "./api";
import type { User, UserFormValues } from "./utils";
import {
	isDuplicateUsername,
	NAME_MAX_LENGTH,
	NAME_PATTERN,
	ORGANIZATION_OPTIONS,
	PASSWORD_MAX_LENGTH,
	PASSWORD_PATTERN,
	ROLE_OPTIONS,
	recordToFormValues,
	USERNAME_MAX_LENGTH,
	USERNAME_PATTERN,
} from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: User | null;
	onCancel: () => void;
	onOk: (values: UserFormValues) => void;
}

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onOk,
}: CreateModalProps) => {
	const [form] = Form.useForm<UserFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue(recordToFormValues(editingRecord));
			return;
		}

		form.resetFields();
	}, [open, editingRecord]);

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
			title={isEdit ? "编辑用户" : "新增用户"}
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
					name="username"
					label="用户账号"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入用户账号",
						},
						{
							max: USERNAME_MAX_LENGTH,
							message: `最多输入${USERNAME_MAX_LENGTH}个字符`,
						},
						{
							pattern: USERNAME_PATTERN,
							message: "仅支持字母、数字和 @",
						},
						{
							validator: (_, value: string) => {
								if (
									isDuplicateUsername(
										getAllUsers(),
										value,
										editingRecord?.id,
									)
								) {
									return Promise.reject(
										new Error("用户账号已存在"),
									);
								}
								return Promise.resolve();
							},
						},
					]}
				>
					<Input
						placeholder="请输入用户账号"
						maxLength={USERNAME_MAX_LENGTH}
						showCount
						disabled={isEdit}
					/>
				</Form.Item>

				<Form.Item
					name="name"
					label="用户姓名"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入用户姓名",
						},
						{
							pattern: NAME_PATTERN,
							message: `请输入 1-${NAME_MAX_LENGTH} 个汉字`,
						},
					]}
				>
					<Input
						placeholder="请输入用户姓名"
						maxLength={NAME_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="password"
					label="密码"
					rules={[
						{ required: !isEdit, message: "请输入密码" },
						{
							max: PASSWORD_MAX_LENGTH,
							message: `最多输入${PASSWORD_MAX_LENGTH}个字符`,
						},
						{
							validator: (_, value: string) => {
								if (!value) return Promise.resolve();
								if (!PASSWORD_PATTERN.test(value)) {
									return Promise.reject(
										new Error(
											"仅支持字母、数字及常见符号 !@#$%^&*._-",
										),
									);
								}
								return Promise.resolve();
							},
						},
					]}
				>
					<Input.Password
						placeholder={isEdit ? "不修改请留空" : "请输入密码"}
						maxLength={PASSWORD_MAX_LENGTH}
					/>
				</Form.Item>

				<Form.Item
					name="organizationId"
					label="所属组织"
					rules={[{ required: true, message: "请选择组织" }]}
				>
					<Select
						placeholder="请选择组织"
						options={[...ORGANIZATION_OPTIONS]}
					/>
				</Form.Item>

				<Form.Item
					name="roleIds"
					label="角色分配"
					rules={[
						{
							required: true,
							type: "array",
							min: 1,
							message: "请至少选择一个角色",
						},
					]}
				>
					<Checkbox.Group options={[...ROLE_OPTIONS]} />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
