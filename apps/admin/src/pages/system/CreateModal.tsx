import { Col, Form, Input, Modal, Row, Select } from "antd";
import { useEffect, useState } from "react";
import { type ApiConfig, create, update } from "./api";
import { STATUS_OPTIONS, TYPE_OPTIONS } from "./utils";

/** 表单字段 */
interface FormValues {
	name: string;
	type: string;
	url: string;
	status: string;
}

interface CreateModalProps {
	open: boolean;
	/** 编辑时传入已有配置，新增时传 null */
	editingRecord: ApiConfig | null;
	onCancel: () => void;
	/** 操作成功后回调（刷新列表） */
	onSuccess: () => void;
}

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onSuccess,
}: CreateModalProps) => {
	const [form] = Form.useForm<FormValues>();
	const [submitting, setSubmitting] = useState(false);

	const isEdit = editingRecord !== null;

	/** 弹窗打开 / 切换编辑对象时回填表单 */
	useEffect(() => {
		if (open) {
			if (editingRecord) {
				form.setFieldsValue({
					name: editingRecord.name,
					type: editingRecord.type,
					url: editingRecord.url,
					status: editingRecord.status,
				});
			} else {
				form.resetFields();
				form.setFieldsValue({ type: "POST", status: "已连接" });
			}
		}
	}, [open, editingRecord, form]);

	/** 提交 */
	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setSubmitting(true);
			if (isEdit) {
				await update(editingRecord?.id, values);
			} else {
				await create(values);
			}
			onSuccess();
			onCancel();
		} catch (err) {
			// 表单校验失败不提示
			if (err && typeof err === "object" && "errorFields" in err) return;
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑接口" : "新增接口"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={submitting}
			destroyOnHidden
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 4 }}
				wrapperCol={{ span: 18 }}
				preserve={false}
				style={{ marginTop: 16 }}
			>
				<Row gutter={[0, 0]}>
					<Col span={24}>
						<Form.Item
							name="name"
							label="名称"
							rules={[
								{ required: true, message: "请输入接口名称" },
							]}
						>
							<Input placeholder="请输入接口名称" />
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col span={24}>
						<Form.Item
							name="type"
							label="类型"
							rules={[
								{ required: true, message: "请选择请求类型" },
							]}
						>
							<Select options={TYPE_OPTIONS} />
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col span={24}>
						<Form.Item
							name="url"
							label="URL"
							rules={[
								{ required: true, message: "请输入接口地址" },
								{ type: "url", message: "请输入合法的 URL" },
							]}
						>
							<Input placeholder="请输入接口地址" />
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col span={24}>
						<Form.Item
							name="status"
							label="状态"
							rules={[{ required: true, message: "请选择状态" }]}
						>
							<Select options={STATUS_OPTIONS} />
						</Form.Item>
					</Col>
				</Row>
			</Form>
		</Modal>
	);
};

export default CreateModal;
