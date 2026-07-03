import {
	Col,
	DatePicker,
	Form,
	Input,
	InputNumber,
	Modal,
	Row,
	Select,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
	buildDeviceNameRules,
	buildManufacturerRules,
	cycleValueRules,
	deviceCodeRules,
	deviceTypeRules,
	requiredSelectRule,
} from "./formRules";
import type { DeviceFormValues, InspectionDevice } from "./types";
import {
	CYCLE_UNIT_OPTIONS,
	calcNextInspectionDate,
	DATE_FORMAT,
	DEFAULT_DEVICE_FORM_VALUES,
	DEVICE_CODE_MAX_LENGTH,
	DEVICE_NAME_MAX_LENGTH,
	DEVICE_TYPE_OPTIONS,
	FACTORY_BUILDING_OPTIONS,
	MANUFACTURER_MAX_LENGTH,
	normalizeDateValue,
	ROOM_OPTIONS_BY_FACTORY,
	recordToFormValues,
	TWIN_FIELD_LABEL_COL,
	TWIN_FIELD_WRAPPER_COL,
} from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: InspectionDevice | null;
	existingDevices: InspectionDevice[];
	onCancel: () => void;
	onOk: (values: DeviceFormValues) => void;
}

const CreateModal = ({
	open,
	editingRecord,
	existingDevices,
	onCancel,
	onOk,
}: CreateModalProps) => {
	const [form] = Form.useForm<DeviceFormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = editingRecord !== null;

	const factoryBuilding = Form.useWatch("factoryBuilding", form);
	const cycleValue = Form.useWatch("cycleValue", form);
	const cycleUnit = Form.useWatch("cycleUnit", form);
	const lastInspectionDate = Form.useWatch("lastInspectionDate", form);

	const roomOptions = useMemo(
		() =>
			factoryBuilding
				? (ROOM_OPTIONS_BY_FACTORY[factoryBuilding] ?? [])
				: [],
		[factoryBuilding],
	);

	// 下次点检日期由「上次点检 + 周期」自动推导，只读展示
	const nextInspectionDate = useMemo(() => {
		if (!lastInspectionDate || !cycleValue || !cycleUnit) return "";
		return calcNextInspectionDate(
			normalizeDateValue(lastInspectionDate),
			cycleValue,
			cycleUnit,
		);
	}, [lastInspectionDate, cycleValue, cycleUnit]);

	const nameRules = useMemo(
		() => buildDeviceNameRules(existingDevices, editingRecord?.id),
		[existingDevices, editingRecord?.id],
	);

	const manufacturerRules = useMemo(
		() => buildManufacturerRules(existingDevices, editingRecord?.id),
		[existingDevices, editingRecord?.id],
	);

	useEffect(() => {
		if (!open) return;

		if (editingRecord) {
			form.setFieldsValue(recordToFormValues(editingRecord));
			return;
		}

		form.resetFields();
		form.setFieldsValue(DEFAULT_DEVICE_FORM_VALUES);
	}, [open, editingRecord, form]);

	const handleFactoryChange = () => {
		form.setFieldValue("room", undefined);
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			onOk({
				...values,
				lastInspectionDate: normalizeDateValue(
					values.lastInspectionDate,
				),
			});
			onCancel();
		} catch {
			// 表单校验失败
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑" : "新增"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width={640}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 4 }}
				wrapperCol={{ span: 20 }}
				preserve={false}
			>
				<Form.Item name="code" label="设备编码" rules={deviceCodeRules}>
					<Input
						placeholder="请输入设备编码"
						maxLength={DEVICE_CODE_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Form.Item name="name" label="设备名称" rules={nameRules}>
					<Input
						placeholder="请输入设备名称"
						maxLength={DEVICE_NAME_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="deviceType"
					label="设备类型"
					rules={deviceTypeRules}
				>
					<Select
						placeholder="请选择设备类型"
						options={DEVICE_TYPE_OPTIONS}
					/>
				</Form.Item>

				<Form.Item
					name="manufacturer"
					label="厂家"
					rules={manufacturerRules}
				>
					<Input
						placeholder="请输入厂家"
						maxLength={MANUFACTURER_MAX_LENGTH}
						showCount
					/>
				</Form.Item>

				<Row gutter={12}>
					<Col span={12}>
						<Form.Item
							name="factoryBuilding"
							label="所属厂房"
							labelCol={TWIN_FIELD_LABEL_COL}
							wrapperCol={TWIN_FIELD_WRAPPER_COL}
							rules={[requiredSelectRule("请选择厂房")]}
						>
							<Select
								placeholder="请选择厂房"
								options={FACTORY_BUILDING_OPTIONS}
								onChange={handleFactoryChange}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="room"
							label="所属房间"
							labelCol={TWIN_FIELD_LABEL_COL}
							wrapperCol={TWIN_FIELD_WRAPPER_COL}
							rules={[requiredSelectRule("请选择房间")]}
						>
							<Select
								placeholder="请选择房间"
								options={roomOptions}
								disabled={!factoryBuilding}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={12}>
					<Col span={12}>
						<Form.Item
							name="cycleValue"
							label="周期数值"
							labelCol={TWIN_FIELD_LABEL_COL}
							wrapperCol={TWIN_FIELD_WRAPPER_COL}
							rules={cycleValueRules}
						>
							<InputNumber
								min={1}
								precision={0}
								step={1}
								placeholder="数值"
								style={{ width: "100%" }}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="cycleUnit"
							label="周期单位"
							labelCol={TWIN_FIELD_LABEL_COL}
							wrapperCol={TWIN_FIELD_WRAPPER_COL}
							rules={[requiredSelectRule("请选择周期单位")]}
						>
							<Select
								placeholder="单位"
								options={CYCLE_UNIT_OPTIONS}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Form.Item
					name="lastInspectionDate"
					label="上次点检日期"
					getValueFromEvent={(value) =>
						value ? value.format(DATE_FORMAT) : undefined
					}
					getValueProps={(value) => ({
						value: value ? dayjs(value) : undefined,
					})}
					rules={[requiredSelectRule("请选择上次点检日期")]}
				>
					<DatePicker style={{ width: "100%" }} />
				</Form.Item>

				<Form.Item label="下次点检日期">
					<span>{nextInspectionDate || "-"}</span>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
