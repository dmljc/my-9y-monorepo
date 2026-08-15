import { Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { detail, listThings } from "./api";
import styles from "./index.module.css";
import type { DeviceItem, InstanceFormValues, SelectOption } from "./interface";
import {
	mergeSelectOption,
	parseDeviceDetail,
	parseThingIds,
	toThingOptions,
} from "./utils";

/**
 * 实例配置弹窗 props。
 */
interface InstanceModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 当前设备。 */
	device: DeviceItem | null;
	/** 弹窗挂载容器（contain 舞台，便于 cqw 与舞台同步缩放）。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: InstanceFormValues) => Promise<void>;
}

/**
 * 实例配置弹窗（蓝湖：实例配置）。
 */
const InstanceModal = ({
	open,
	device,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: InstanceModalProps) => {
	const [form] = Form.useForm<InstanceFormValues>();
	const [loading, setLoading] = useState(false);
	const [instanceLoading, setInstanceLoading] = useState(false);
	const [instanceOptions, setInstanceOptions] = useState<SelectOption[]>([]);
	const manufacturerValue = Form.useWatch("manufacturer", form);

	useEffect(() => {
		if (!open) {
			setInstanceOptions([]);
			return;
		}

		form.setFieldsValue({
			deviceName: device?.name ?? "",
			deviceCode: device?.code ?? "",
			manufacturer: device?.manufacturer ?? "",
			thingIds: parseThingIds(device?.thingId),
		});

		let ignore = false;
		const deviceId = device?.id ?? 0;
		setInstanceLoading(true);
		Promise.all([
			listThings(),
			deviceId ? detail(deviceId).catch(() => null) : Promise.resolve(null),
		])
			.then(([thingsData, detailData]) => {
				if (ignore) return;
				const options = toThingOptions(thingsData);
				let selectedIds = parseThingIds(device?.thingId);
				if (detailData) {
					const parsed = parseDeviceDetail(detailData);
					const manufacturer = String(
						parsed.device.manufacturer ?? "",
					).trim();
					const next: Partial<InstanceFormValues> = {
						thingIds: parsed.thingIds,
					};
					if (manufacturer) next.manufacturer = manufacturer;
					if (parsed.device.deviceName) {
						next.deviceName = String(parsed.device.deviceName);
					}
					if (parsed.device.deviceCode) {
						next.deviceCode = String(parsed.device.deviceCode);
					}
					selectedIds = parsed.thingIds;
					form.setFieldsValue(next);
				}
				let nextOptions = options;
				for (const id of selectedIds) {
					nextOptions = mergeSelectOption(nextOptions, id, id);
				}
				setInstanceOptions(nextOptions);
			})
			.finally(() => {
				if (!ignore) setInstanceLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [open, device?.deviceId]);

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
			rootClassName={styles.modalRoot}
			title="实例配置"
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
				<Form.Item name="manufacturer" label="设备厂家">
					<Select
						disabled
						options={
							manufacturerValue
								? [
										{
											label: manufacturerValue,
											value: manufacturerValue,
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
						classNames={{
							popup: { root: styles.modalPopup },
						}}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default InstanceModal;
