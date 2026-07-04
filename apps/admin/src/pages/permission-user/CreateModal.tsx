import { Checkbox, Form, Input, Modal, TreeSelect } from "antd";
import { useEffect, useState } from "react";
import {
	getPasswordRules,
	PASSWORD_MAX_LENGTH,
	USERNAME_MAX_LENGTH,
	USERNAME_RULES,
} from "./formRules";
import type { DeptTreeNode } from "./interface";
import type { SelectOption, User, UserFormValues } from "./utils";
import {
	EDIT_PASSWORD_PLACEHOLDER,
	getDeptTree,
	getRoleOptions,
	NAME_MAX_LENGTH,
	NAME_PATTERN,
	recordToFormValues,
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
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<UserFormValues>();
	const [loading, setLoading] = useState(false);
	const [deptTree, setDeptTree] = useState<DeptTreeNode[]>([]);
	const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
	const isEdit = editingRecord !== null;

	/** 编辑态占位符视为空值，跳过长度/格式校验（表示不修改密码） */
	const skipEditPasswordPlaceholder = (value: string) =>
		isEdit && value === EDIT_PASSWORD_PLACEHOLDER ? "" : value;

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

	const handlePasswordKeyDown = (
		event: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (!isEdit) return;
		if (form.getFieldValue("password") !== EDIT_PASSWORD_PLACEHOLDER) {
			return;
		}
		if (event.key === "Backspace" || event.key === "Delete") {
			form.setFieldValue("password", "");
			return;
		}
		if (
			event.key.length === 1 &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey
		) {
			form.setFieldValue("password", "");
		}
	};

	const handlePasswordClear = () => {
		form.setFieldValue("password", "");
	};

	const onOk = async () => {
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
			await onOkProp(payload);
			onCancel();
		} catch {
			// 表单校验失败或接口失败；接口 toast 已由全局 onError 弹出
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
					name="username"
					label="用户账号"
					rules={USERNAME_RULES}
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
						{
							pattern: NAME_PATTERN,
							message: "可以包含中文、字母、数字",
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
					rules={getPasswordRules(
						!isEdit,
						skipEditPasswordPlaceholder,
					)}
				>
					<Input
						placeholder={isEdit ? "请输入新密码" : "请输入密码"}
						maxLength={PASSWORD_MAX_LENGTH}
						allowClear
						onKeyDown={handlePasswordKeyDown}
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
