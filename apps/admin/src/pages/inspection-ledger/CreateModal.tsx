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
import { useEffect, useState } from "react";
import { buildings as fetchBuildings, rooms as fetchRooms } from "./api";
import type { DeviceFormValues, DeviceLedger } from "./interface";
import {
	CYCLE_UNIT_OPTIONS,
	DATE_FORMAT,
	DEFAULT_FORM_VALUES,
	MAX_LENGTH_12,
	MAX_LENGTH_20,
	normalizeBuildingOptions,
	normalizeDateValue,
	normalizeRoomOptions,
	TYPE_OPTIONS,
} from "./utils";

const TWIN_LABEL_COL = { span: 8 };
const TWIN_WRAPPER_COL = { span: 16 };

interface CreateModalProps {
	open: boolean;
	editingRecord: DeviceLedger | null;
	onCancel: () => void;
	onOk: (values: DeviceFormValues) => Promise<void>;
}

const CreateModal = ({
	open,
	editingRecord,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<DeviceFormValues>();
	const [loading, setLoading] = useState(false);
	const [buildingLoading, setBuildingLoading] = useState(false);
	const [buildingOptions, setBuildingOptions] = useState<
		{ label: string; value: string }[]
	>([]);
	const [roomLoading, setRoomLoading] = useState(false);
	const [roomOptions, setRoomOptions] = useState<
		{ label: string; value: string }[]
	>([]);
	const isEdit = editingRecord !== null;

	const building = Form.useWatch("building", form);
	const cycleValue = Form.useWatch("cycleValue", form);
	const cycleUnit = Form.useWatch("cycleUnit", form);
	const lastInspection = Form.useWatch("lastInspection", form);

	let nextInspectionDate = "";
	if (lastInspection && cycleValue && cycleUnit) {
		const unit = cycleUnit === "month" ? "month" : "day";
		nextInspectionDate = dayjs(lastInspection)
			.add(cycleValue, unit)
			.format(DATE_FORMAT);
	}

	useEffect(() => {
		if (!open) return;
		form.resetFields();
		if (editingRecord) {
			form.setFieldsValue({
				...editingRecord,
				lastInspection: normalizeDateValue(
					editingRecord.lastInspection,
				),
			});
			return;
		}
		form.setFieldsValue(DEFAULT_FORM_VALUES);
	}, [open, editingRecord]);

	useEffect(() => {
		if (!open) return;

		let ignore = false;
		const loadBuildings = async () => {
			setBuildingLoading(true);
			try {
				const buildingData = await fetchBuildings();
				if (!ignore) {
					setBuildingOptions(
						normalizeBuildingOptions(buildingData, false),
					);
				}
			} finally {
				if (!ignore) {
					setBuildingLoading(false);
				}
			}
		};

		loadBuildings();

		return () => {
			ignore = true;
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;
		if (!building) {
			setRoomOptions([]);
			return;
		}

		let ignore = false;
		const loadRooms = async () => {
			setRoomLoading(true);
			try {
				const roomData = await fetchRooms({ buildingId: building });
				if (!ignore) {
					setRoomOptions(normalizeRoomOptions(roomData));
				}
			} finally {
				if (!ignore) {
					setRoomLoading(false);
				}
			}
		};

		loadRooms();

		return () => {
			ignore = true;
		};
	}, [open, building]);

	const handleFactoryChange = () => {
		form.setFieldValue("room", undefined);
	};

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);
			await onOkProp(values);
			onCancel();
		} catch {
			// 表单校验失败或接口失败
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
			width={640}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 4 }}
				wrapperCol={{ span: 20 }}
				preserve={false}
			>
				<Form.Item
					name="deviceCode"
					label="设备编码"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入设备编码",
						},
						{
							max: MAX_LENGTH_20,
							message: `最多输入${MAX_LENGTH_20}个字符`,
						},
					]}
				>
					<Input
						placeholder="请输入设备编码"
						maxLength={MAX_LENGTH_20}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="deviceName"
					label="设备名称"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入设备名称",
						},
						{
							max: MAX_LENGTH_12,
							message: `最多输入${MAX_LENGTH_12}个字符`,
						},
					]}
				>
					<Input
						placeholder="请输入设备名称"
						maxLength={MAX_LENGTH_12}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="deviceType"
					label="设备类型"
					rules={[{ required: true, message: "请选择设备类型" }]}
				>
					<Select
						placeholder="请选择设备类型"
						options={TYPE_OPTIONS}
					/>
				</Form.Item>

				<Form.Item
					name="manufacturer"
					label="厂家"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入厂家",
						},
						{
							max: MAX_LENGTH_12,
							message: `最多输入${MAX_LENGTH_12}个字符`,
						},
					]}
				>
					<Input
						placeholder="请输入厂家"
						maxLength={MAX_LENGTH_12}
						showCount
					/>
				</Form.Item>

				<Row gutter={12}>
					<Col span={12}>
						<Form.Item
							name="building"
							label="所属厂房"
							labelCol={TWIN_LABEL_COL}
							wrapperCol={TWIN_WRAPPER_COL}
							rules={[{ required: true, message: "请选择厂房" }]}
						>
							<Select
								placeholder="请选择厂房"
								options={buildingOptions}
								loading={buildingLoading}
								onChange={handleFactoryChange}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="room"
							label="所属房间"
							labelCol={TWIN_LABEL_COL}
							wrapperCol={TWIN_WRAPPER_COL}
							rules={[{ required: true, message: "请选择房间" }]}
						>
							<Select
								placeholder="请选择房间"
								options={roomOptions}
								loading={roomLoading}
								disabled={!building}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={12}>
					<Col span={12}>
						<Form.Item
							name="cycleValue"
							label="周期数值"
							labelCol={TWIN_LABEL_COL}
							wrapperCol={TWIN_WRAPPER_COL}
							rules={[
								{ required: true, message: "请输入周期数值" },
								{
									type: "number",
									min: 1,
									message: "请输入大于等于1的自然数",
								},
							]}
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
							labelCol={TWIN_LABEL_COL}
							wrapperCol={TWIN_WRAPPER_COL}
							rules={[
								{ required: true, message: "请选择周期单位" },
							]}
						>
							<Select
								placeholder="单位"
								options={CYCLE_UNIT_OPTIONS}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Form.Item
					name="lastInspection"
					label="上次点检日期"
					getValueFromEvent={(value) =>
						value ? value.format(DATE_FORMAT) : undefined
					}
					getValueProps={(value) => ({
						value: value ? dayjs(value) : undefined,
					})}
					rules={[{ required: true, message: "请选择上次点检日期" }]}
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
