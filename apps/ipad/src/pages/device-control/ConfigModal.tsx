import { Form, Input, Modal, Select } from "antd";
import type { Rule } from "antd/es/form";
import { useEffect, useState } from "react";
import { listAlarmRooms, listThings } from "./api";
import styles from "./index.module.css";
import type {
	ConfigFormValues,
	ConfigType,
	DeviceItem,
	SelectOption,
} from "./interface";
import {
	FLOW_RATE_MAX,
	FLOW_RATE_MIN,
	mergeSelectOption,
	normalizeRoomOptions,
	parseThingIds,
	toThingOptions,
} from "./utils";

/**
 * 房间 / 实例配置弹窗 props。
 */
interface ConfigModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 配置类型。 */
	configType: ConfigType | null;
	/** 当前设备。 */
	device: DeviceItem | null;
	/** 当前厂房 ID。 */
	buildingId: number;
	/** 弹窗挂载容器（页面根，便于 cqw 缩放）。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: ConfigFormValues) => Promise<void>;
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
 * 房间配置 / 实例配置弹窗（蓝湖：房间配置、实例配置）。
 */
const ConfigModal = ({
	open,
	configType,
	device,
	buildingId,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: ConfigModalProps) => {
	const [form] = Form.useForm<ConfigFormValues>();
	const [loading, setLoading] = useState(false);
	const [roomLoading, setRoomLoading] = useState(false);
	const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
	const [instanceLoading, setInstanceLoading] = useState(false);
	const [instanceOptions, setInstanceOptions] = useState<SelectOption[]>([]);
	const isRoom = configType === "room";

	useEffect(() => {
		if (!open || !configType) {
			setRoomOptions([]);
			setInstanceOptions([]);
			return;
		}

		form.setFieldsValue({
			deviceName: device?.name ?? "",
			deviceCode: device?.code ?? "",
			manufacturer: device?.manufacturer ?? "",
			roomId: device?.roomId ? String(device.roomId) : undefined,
			room: device?.roomLabel,
			flowRate:
				device?.flowRate !== null && device?.flowRate !== undefined
					? String(device.flowRate)
					: undefined,
			thingIds: parseThingIds(device?.thingId),
		});

		let ignore = false;
		if (isRoom && buildingId) {
			setRoomLoading(true);
			listAlarmRooms(buildingId)
				.then((data) => {
					if (ignore) return;
					setRoomOptions(
						mergeSelectOption(
							normalizeRoomOptions(data),
							device?.roomId ? String(device.roomId) : undefined,
							device?.roomLabel,
						),
					);
				})
				.finally(() => {
					if (!ignore) setRoomLoading(false);
				});
		}

		if (!isRoom) {
			setInstanceLoading(true);
			listThings()
				.then((data) => {
					if (ignore) return;
					const options = toThingOptions(data);
					const selectedIds = parseThingIds(device?.thingId);
					let next = options;
					for (const id of selectedIds) {
						next = mergeSelectOption(next, id, id);
					}
					setInstanceOptions(next);
				})
				.finally(() => {
					if (!ignore) setInstanceLoading(false);
				});
		}

		return () => {
			ignore = true;
		};
	}, [open, configType, device?.deviceId, buildingId, isRoom]);

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
			title={isRoom ? "房间配置" : "实例配置"}
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
				{isRoom ? (
					<>
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
								classNames={{ popup: { root: styles.modalPopup } }}
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
								label="流量"
								rules={flowRateRules}
								className={styles.flowItem}
							>
								<Input placeholder="请输入流量" />
							</Form.Item>
							<span className={styles.flowUnit}>m/s</span>
						</div>
					</>
				) : (
					<>
						<Form.Item name="manufacturer" label="设备厂家">
							<Select
								disabled
								options={
									device?.manufacturer
										? [
												{
													label: device.manufacturer,
													value: device.manufacturer,
												},
											]
										: []
								}
							/>
						</Form.Item>
						<Form.Item
							name="thingIds"
							label="选择实例"
							rules={[
								{
									required: true,
									type: "array",
									min: 1,
									message: "请选择实例",
								},
							]}
						>
							<Select
								mode="multiple"
								showSearch={{ optionFilterProp: "label" }}
								placeholder="请选择实例"
								options={instanceOptions}
								loading={instanceLoading}
								allowClear
								maxTagCount="responsive"
								getPopupContainer={getContainer}
								classNames={{ popup: { root: styles.modalPopup } }}
							/>
						</Form.Item>
					</>
				)}
			</Form>
		</Modal>
	);
};

export default ConfigModal;
