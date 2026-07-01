import { Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import type { User, UserFormValues } from "./utils";
import {
	EMAIL_MAX_LENGTH,
	isDuplicateUsername,
	PHONE_MAX_LENGTH,
	REAL_NAME_MAX_LENGTH,
	USER_STATUS_OPTIONS,
	USERNAME_MAX_LENGTH,
} from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: User | null;
	existingUsers: User[];
	onCancel: () => void;
	onOk: (values: UserFormValues) => void;
}

const CreateModal = ({
	open,
	editingRecord,
	existingUsers,
	onCancel,
	onOk,
}: CreateModalProps) => {
	const [form] = Form.useForm<UserFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue({
				username: editingRecord.username,
				realName: editingRecord.realName,
				roleName: editingRecord.roleName,
				phone: editingRecord.phone,
				email: editingRecord.email,
				status: editingRecord.status,
			});
			return;
		}

		form.resetFields();
		form.setFieldsValue({ status: "enabled" });
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
					label="用户名"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入用户名",
						},
						{
							max: USERNAME_MAX_LENGTH,
							message: `最多输入${USERNAME_MAX_LENGTH}个字符`,
						},
						{
							validator: (_, value: string) => {
								if (
									isDuplicateUsername(
										existingUsers,
										value,
										editingRecord?.id,
									)
								) {
									return Promise.reject(
										new Error("用户名已存在"),
									);
								}
								return Promise.resolve();
							},
						},
					]}
				>
					<Input
						placeholder="请输入用户名"
						maxLength={USERNAME_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="realName"
					label="真实姓名"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入真实姓名",
						},
						{
							max: REAL_NAME_MAX_LENGTH,
							message: `最多输入${REAL_NAME_MAX_LENGTH}个字符`,
						},
					]}
				>
					<Input
						placeholder="请输入真实姓名"
						maxLength={REAL_NAME_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="roleName"
					label="所属角色"
					rules={[{ required: true, message: "请输入所属角色" }]}
				>
					<Input placeholder="请输入所属角色" />
				</Form.Item>

				<Form.Item
					name="phone"
					label="手机号"
					rules={[
						{
							max: PHONE_MAX_LENGTH,
							message: `最多输入${PHONE_MAX_LENGTH}个字符`,
						},
					]}
				>
					<Input
						placeholder="请输入手机号"
						maxLength={PHONE_MAX_LENGTH}
					/>
				</Form.Item>

				<Form.Item
					name="email"
					label="邮箱"
					rules={[
						{ type: "email", message: "请输入正确的邮箱格式" },
						{
							max: EMAIL_MAX_LENGTH,
							message: `最多输入${EMAIL_MAX_LENGTH}个字符`,
						},
					]}
				>
					<Input
						placeholder="请输入邮箱"
						maxLength={EMAIL_MAX_LENGTH}
					/>
				</Form.Item>

				<Form.Item
					name="status"
					label="状态"
					rules={[{ required: true, message: "请选择状态" }]}
				>
					<Select
						placeholder="请选择状态"
						options={[...USER_STATUS_OPTIONS]}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
