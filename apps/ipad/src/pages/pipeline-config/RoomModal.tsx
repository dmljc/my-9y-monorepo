import { Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import type { RoomFormValues, RoomItem } from "./interface";
import { MAX_LENGTH_20 } from "./utils";

/**
 * 房间配置弹窗 props。
 */
interface RoomModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 编辑中的记录；新增时为 null。 */
	editingRecord: RoomItem | null;
	/** 页面根层已判定软键盘打开。 */
	keyboardOpen?: boolean;
	/** 弹窗挂载容器。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: RoomFormValues) => Promise<void>;
}

/**
 * 新增 / 编辑房间弹窗。
 */
const RoomModal = ({
	open,
	editingRecord,
	keyboardOpen = false,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: RoomModalProps) => {
	const [form] = Form.useForm<RoomFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	useEffect(() => {
		if (!open) {
			setLoading(false);
			return;
		}
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
			className={styles.modal}
			rootClassName={`${styles.modalRoot} ${
				keyboardOpen ? styles.modalKeyboardOpen : ""
			}`}
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={loading}
			closable={!loading}
			destroyOnHidden
			keyboard={!loading}
			mask={{ closable: !loading }}
			centered={!keyboardOpen}
			width="calc(600 / 1400 * 100cqw)"
			getContainer={getContainer}
		>
			<Form
				form={form}
				layout="vertical"
				preserve={false}
				className={styles.form}
			>
				<Form.Item
					name="room"
					label="房间号"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入房间号",
						},
						{
							max: MAX_LENGTH_20,
							message: `最多输入${MAX_LENGTH_20}个字符`,
						},
					]}
				>
					<Input
						placeholder="请输入房间号"
						maxLength={MAX_LENGTH_20}
						allowClear
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default RoomModal;
