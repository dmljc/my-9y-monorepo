import { Form, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { listAlarmRooms } from "./api";
import styles from "./index.module.css";
import type {
	PipelineFormValues,
	PipelineItem,
	RoomOption,
} from "./interface";
import { buildRoomOptions, PIPE_IN_OPTIONS } from "./utils";

/**
 * 房间管道配置弹窗 props。
 */
interface CreateModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 编辑中的记录；新增时为 null。 */
	editingRecord: PipelineItem | null;
	/** 当前厂房 ID。 */
	buildingId: number;
	/** 弹窗挂载容器。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: PipelineFormValues) => Promise<void>;
}

/**
 * 新增 / 编辑房间管道配置弹窗。
 */
const CreateModal = ({
	open,
	editingRecord,
	buildingId,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<PipelineFormValues>();
	const [loading, setLoading] = useState(false);
	const [roomLoading, setRoomLoading] = useState(false);
	const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) {
			setLoading(false);
			setRoomOptions([]);
			return;
		}
		if (editingRecord) {
			form.setFieldsValue({
				roomId: String(editingRecord.roomId ?? ""),
				room: editingRecord.sampleRoom,
				pipeIn: editingRecord.pipeIn,
			});
			return;
		}
		form.resetFields();
	}, [open, editingRecord, form]);

	useEffect(() => {
		if (!open || !buildingId) return;

		let ignore = false;
		setRoomLoading(true);
		listAlarmRooms(buildingId)
			.then((data) => {
				if (!ignore) setRoomOptions(buildRoomOptions(data));
			})
			.finally(() => {
				if (!ignore) setRoomLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [open, buildingId]);

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			await onOkProp(values);
			onCancel();
		} catch (err) {
			if (err && typeof err === "object" && "errorFields" in err) return;
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			className={styles.modal}
			rootClassName={styles.modalRoot}
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			centered
			width="calc(600 / 1400 * 100cqw)"
			getContainer={getContainer}
		>
			<Form form={form} layout="vertical" preserve={false} className={styles.form}>
				<Form.Item
					name="roomId"
					label="房间号"
					rules={[{ required: true, message: "请选择房间号" }]}
				>
					<Select
						placeholder="请选择房间号"
						options={roomOptions}
						loading={roomLoading}
						allowClear
						showSearch={{ optionFilterProp: "label" }}
						onChange={(value) => {
							const option = roomOptions.find(
								(item) => item.value === value,
							);
							form.setFieldValue("room", option?.label);
						}}
					/>
				</Form.Item>
				<Form.Item name="room" hidden>
					<input />
				</Form.Item>
				<Form.Item name="pipeIn" label="管道号（IN）">
					<Select
						placeholder="请选择管道号"
						options={PIPE_IN_OPTIONS}
						allowClear
						showSearch={{ optionFilterProp: "label" }}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
