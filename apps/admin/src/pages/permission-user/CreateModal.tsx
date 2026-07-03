import { Checkbox, Form, Input, Modal, TreeSelect } from "antd";
import { useEffect, useState } from "react";
import type { DeptTreeNode } from "./interface";
import type { SelectOption, User, UserFormValues } from "./utils";
import {
	EDIT_PASSWORD_PLACEHOLDER,
	getDeptTree,
	getRoleOptions,
	NAME_MAX_LENGTH,
	// NAME_PATTERN,
	PASSWORD_MAX_LENGTH,
	PASSWORD_PATTERN,
	recordToFormValues,
	USERNAME_MAX_LENGTH,
	USERNAME_PATTERN,
} from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: User | null;
	onCancel: () => void;
	onOk: (values: UserFormValues) => Promise<void>;
}

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onOk,
}: CreateModalProps) => {
	const [form] = Form.useForm<UserFormValues>();
	const [loading, setLoading] = useState(false);
	const [deptTree, setDeptTree] = useState<DeptTreeNode[]>([]);
	const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		const init = async () => {
			const [tree, roles] = await Promise.all([
				getDeptTree(),
				getRoleOptions(),
			]);
			setDeptTree(tree);
			setRoleOptions(roles);

			if (editingRecord) {
				form.setFieldsValue({
					...recordToFormValues(editingRecord),
					password: EDIT_PASSWORD_PLACEHOLDER,
				});
				return;
			}

			form.resetFields();
		};

		init();
	}, [open, editingRecord]);

	const handlePasswordFocus = () => {
		if (!isEdit) return;
		if (form.getFieldValue("password") === EDIT_PASSWORD_PLACEHOLDER) {
			form.setFieldValue("password", "");
		}
	};

	const handlePasswordClear = () => {
		form.setFieldValue("password", "");
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			const payload: UserFormValues = { ...values };
			if (
				isEdit &&
				(!payload.password?.trim() ||
					payload.password === EDIT_PASSWORD_PLACEHOLDER)
			) {
				delete payload.password;
			}
			await onOk(payload);
			onCancel();
		} catch {
			// 表单校验失败或提交失败
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
							message: "可以包含大小写字母、数字、@",
						},
					]}
				>
					<Input
						placeholder="请输入用户账号"
						maxLength={USERNAME_MAX_LENGTH}
						showCount
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
							max: NAME_MAX_LENGTH,
							message: `最多输入${NAME_MAX_LENGTH}个字符`,
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
								if (
									!value ||
									(isEdit &&
										value === EDIT_PASSWORD_PLACEHOLDER)
								) {
									return Promise.resolve();
								}
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
						placeholder={isEdit ? "请输入新密码" : "请输入密码"}
						maxLength={PASSWORD_MAX_LENGTH}
						allowClear
						onFocus={handlePasswordFocus}
						onClear={handlePasswordClear}
					/>
				</Form.Item>

				<Form.Item
					name="organizationId"
					label="所属组织"
					rules={[{ required: true, message: "请选择组织" }]}
				>
					<TreeSelect
						placeholder="请选择组织"
						treeData={deptTree}
						fieldNames={{
							label: "label",
							value: "id",
							children: "children",
						}}
						treeDefaultExpandAll
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
					<Checkbox.Group options={roleOptions} />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
