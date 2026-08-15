import { Form, Input, Modal, Select } from "antd";
import type { Rule } from "antd/es/form";
import { useEffect, useState } from "react";
import { listAlarmRooms, roomDetail } from "./api";
import styles from "./index.module.css";
import type { DeviceItem, RoomFormValues, SelectOption } from "./interface";
import {
	FLOW_RATE_MAX,
	FLOW_RATE_MIN,
	mergeSelectOption,
	normalizeRoomOptions,
	parseRoomDeviceInfo,
} from "./utils";

/**
 * 房间配置弹窗 props。
 */
interface RoomModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 当前设备。 */
	device: DeviceItem | null;
	/** 当前厂房 ID。 */
	buildingId: number;
	/** 弹窗挂载容器（contain 舞台，便于 cqw 与舞台同步缩放）。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: RoomFormValues) => Promise<void>;
}

/** 流量校验。 */
const flowRateRules: Rule[] = [
	{ required: true, whitespace: true, message: "请输入流量" },
	{
		pattern: /^\d+(\.\d{1,2})?$/,
		message: "请输入0～999999.99的数字，最多两位小数",
	},
	{
		type: "number",
		min: FLOW_RATE_MIN,
		max: FLOW_RATE_MAX,
		message: "请输入0～999999.99的数字，最多两位小数",
		transform: (value) => {
			if (value === undefined || value === null || value === "") {
				return value;
			}
			const num = Number(value);
			return Number.isFinite(num) ? num : value;
		},
	},
];

/**
 * 连接房间弹窗。
 */
const RoomModal = ({
	open,
	device,
	buildingId,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: RoomModalProps) => {
	const [form] = Form.useForm<RoomFormValues>();
	const [loading, setLoading] = useState(false);
	const [roomLoading, setRoomLoading] = useState(false);
	const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);

	useEffect(() => {
		if (!open) {
			setRoomOptions([]);
			return;
		}

		form.setFieldsValue({
			deviceName: device?.name ?? "",
			deviceCode: device?.code ?? "",
			roomId: device?.roomId ? String(device.roomId) : undefined,
			room: device?.roomLabel,
			flowRate:
				device?.flowRate !== null && device?.flowRate !== undefined
					? String(device.flowRate)
					: undefined,
		});

		let ignore = false;
		const deviceId = device?.deviceId ?? 0;
		setRoomLoading(true);
		Promise.all([
			buildingId ? listAlarmRooms(buildingId) : Promise.resolve(null),
			deviceId
				? roomDetail(deviceId).catch(() => null)
				: Promise.resolve(null),
		])
			.then(([roomsData, infoData]) => {
				if (ignore) return;
				let roomId = device?.roomId
					? String(device.roomId)
					: undefined;
				let roomLabel = device?.roomLabel;
				if (infoData) {
					const parsed = parseRoomDeviceInfo(infoData);
					const next: Partial<RoomFormValues> = {};
					if (parsed.deviceName) next.deviceName = parsed.deviceName;
					if (parsed.deviceCode) next.deviceCode = parsed.deviceCode;
					if (parsed.roomId) {
						roomId = String(parsed.roomId);
						next.roomId = roomId;
					}
					if (parsed.room) {
						roomLabel = parsed.room;
						next.room = parsed.room;
					}
					next.flowRate =
						parsed.flowRate !== null &&
						parsed.flowRate !== undefined
							? String(parsed.flowRate)
							: undefined;
					form.setFieldsValue(next);
				}
				setRoomOptions(
					mergeSelectOption(
						roomsData != null
							? normalizeRoomOptions(roomsData)
							: [],
						roomId,
						roomLabel,
					),
				);
			})
			.finally(() => {
				if (!ignore) setRoomLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [open, device?.deviceId, buildingId]);

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			const room = roomOptions.find((item) => item.value === values.roomId);
			setLoading(true);
			await onOkProp({
				...values,
				room: room?.label ?? values.room,
			});
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
			rootClassName={styles.modalRoot}
			title="连接房间"
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			centered
			width="calc(730 / 1400 * 100cqw)"
			getContainer={getContainer}
			footer={(_, { OkBtn, CancelBtn }) => (
				<div className={styles.modalFooter}>
					<div className={styles.modalFooterBtns}>
						<CancelBtn />
						<OkBtn />
					</div>
					<div className={styles.modalHint}>
						提示:操作前请确认信息准确无误!
					</div>
				</div>
			)}
		>
			<Form
				form={form}
				layout="vertical"
				preserve={false}
				className={styles.form}
			>
				<Form.Item name="deviceName" label="设备名称">
					<Input disabled />
				</Form.Item>
				<Form.Item name="deviceCode" label="设备编号">
					<Input disabled />
				</Form.Item>
				<Form.Item name="room" hidden>
					<Input />
				</Form.Item>
				<Form.Item
					name="roomId"
					label="房间名称"
					rules={[{ required: true, message: "请选择房间名称" }]}
				>
					<Select
						showSearch={{ optionFilterProp: "label" }}
						placeholder="请选择房间名称"
						options={roomOptions}
						loading={roomLoading}
						allowClear
						getPopupContainer={getContainer}
						classNames={{
							popup: { root: styles.modalPopup },
						}}
						onChange={(value) => {
							const option = roomOptions.find(
								(item) => item.value === value,
							);
							form.setFieldValue("room", option?.label);
						}}
					/>
				</Form.Item>
				<div className={styles.flowRow}>
					<Form.Item
						name="flowRate"
						label="流速"
						rules={flowRateRules}
						className={styles.flowItem}
					>
						<Input placeholder="请输入流速" />
					</Form.Item>
					<span className={styles.flowUnit}>m³/h</span>
				</div>
			</Form>
		</Modal>
	);
};

export default RoomModal;
