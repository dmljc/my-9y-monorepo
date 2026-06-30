import { DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import type { TaskItem } from "./api";
import { AREA_OPTIONS } from "./utils";

interface FormValues {
	title: string;
	area: string;
	device: string;
	taskTime: [Dayjs, Dayjs];
}

interface CreateTaskModalProps {
	open: boolean;
	editingRecord: TaskItem | null;
	onCancel: () => void;
	onSuccess: (values: FormValues, editingId: string | null) => void;
}

const CreateTaskModal = ({
	open,
	editingRecord,
	onCancel,
	onSuccess,
}: CreateTaskModalProps) => {
	const [form] = Form.useForm<FormValues>();
	const [submitting, setSubmitting] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) {
			return;
		}
		if (editingRecord) {
			form.setFieldsValue({
				title: editingRecord.title,
				area: editingRecord.area,
				device: editingRecord.device,
				taskTime: [
					dayjs(editingRecord.taskTimeStart),
					dayjs(editingRecord.taskTimeEnd),
				],
			});
		} else {
			form.resetFields();
		}
	}, [open, editingRecord, form]);

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setSubmitting(true);
			onSuccess(values, editingRecord?.id ?? null);
			onCancel();
		} catch (err) {
			if (err && typeof err === "object" && "errorFields" in err) {
				return;
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑任务" : "新增任务"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			okText="保存"
			cancelText="取消"
			confirmLoading={submitting}
			destroyOnHidden
			width={520}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 5 }}
				wrapperCol={{ span: 18 }}
				preserve={false}
				style={{ marginTop: 16 }}
			>
				<Form.Item
					name="title"
					label="任务名称"
					rules={[{ required: true, message: "请输入任务名称" }]}
				>
					<Input placeholder="请输入任务名称" />
				</Form.Item>
				<Form.Item
					name="area"
					label="任务区域"
					rules={[{ required: true, message: "请选择任务区域" }]}
				>
					<Select
						placeholder="请选择任务区域"
						options={AREA_OPTIONS}
					/>
				</Form.Item>
				<Form.Item
					name="device"
					label="巡检设备"
					rules={[{ required: true, message: "请输入巡检设备" }]}
				>
					<Input placeholder="请输入巡检设备" />
				</Form.Item>
				<Form.Item
					name="taskTime"
					label="任务时间"
					rules={[{ required: true, message: "请选择任务时间" }]}
				>
					<DatePicker.RangePicker
						showTime={{ format: "HH:mm" }}
						format="YYYY-MM-DD HH:mm"
						placeholder={["开始时间", "结束时间"]}
						style={{ width: "100%" }}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateTaskModal;
