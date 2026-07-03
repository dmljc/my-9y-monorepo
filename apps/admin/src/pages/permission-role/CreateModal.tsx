import { Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import type { SysRole } from "./interface";
import type { RoleFormValues } from "./utils";
import {
	isDuplicateRoleName,
	ROLE_DESCRIPTION_MAX_LENGTH,
	ROLE_NAME_MAX_LENGTH,
} from "./utils";

const { TextArea } = Input;

interface CreateModalProps {
	open: boolean;
	editingRecord: SysRole | null;
	existingRoles: SysRole[];
	onCancel: () => void;
	onOk: (values: RoleFormValues) => Promise<void>;
}

const CreateModal = ({
	open,
	editingRecord,
	existingRoles,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<RoleFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue(editingRecord);
			return;
		}

		form.resetFields();
	}, [open, editingRecord]);

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			await onOkProp(values);
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
					name="roleName"
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
								if (
									isDuplicateRoleName(
										existingRoles,
										value,
										editingRecord?.roleId,
									)
								) {
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
					name="remark"
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
