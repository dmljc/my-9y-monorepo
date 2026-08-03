import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import {
	buildings as fetchBuildings,
	rooms as fetchRooms,
	getControllable,
	getThings,
	listDevices,
} from "./api";
import styles from "./index.module.css";
import type {
	RuleFormValues,
	RuleLevelOption,
	SelectOption,
	WarningRule,
} from "./utils";
import {
	MAX_LENGTH_12,
	mergeOption,
	normalizeBuildingOptions,
	normalizeDeviceOptions,
	normalizeRoomOptions,
	THRESHOLD_MAX,
	THRESHOLD_MIN,
	toPropertyOptions,
	toThingOptions,
} from "./utils";

interface CreateModalProps {
	open: boolean;
	editingRecord: WarningRule | null;
	levelOptions: RuleLevelOption[];
	onCancel: () => void;
	onSubmit: (values: RuleFormValues) => Promise<void>;
}

const CreateModal = ({
	open,
	editingRecord,
	levelOptions,
	onCancel,
	onSubmit,
}: CreateModalProps) => {
	const [form] = Form.useForm<RuleFormValues>();
	const [loading, setLoading] = useState(false);
	const [buildingLoading, setBuildingLoading] = useState(false);
	const [buildingOptions, setBuildingOptions] = useState<SelectOption[]>([]);
	const [roomLoading, setRoomLoading] = useState(false);
	const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
	const [deviceLoading, setDeviceLoading] = useState(false);
	const [deviceOptions, setDeviceOptions] = useState<SelectOption[]>([]);
	const [instanceLoading, setInstanceLoading] = useState(false);
	const [instanceOptions, setInstanceOptions] = useState<SelectOption[]>([]);
	const [pointLoading, setPointLoading] = useState(false);
	const [pointOptions, setPointOptions] = useState<SelectOption[]>([]);
	const isEdit = editingRecord !== null;
	const buildingId = Form.useWatch("buildingId", form);
	const room = Form.useWatch("room", form);
	const instanceName = Form.useWatch("instanceName", form);

	useEffect(() => {
		if (!open) {
			setBuildingOptions([]);
			setRoomOptions([]);
			setDeviceOptions([]);
			setInstanceOptions([]);
			setPointOptions([]);
			return;
		}

		if (editingRecord) {
			form.setFieldsValue(editingRecord);
		} else {
			form.resetFields();
			form.setFieldsValue({ enabled: true });
		}

		let ignore = false;
		const loadBuildings = async () => {
			setBuildingLoading(true);
			try {
				const data = await fetchBuildings();
				if (ignore) return;
				setBuildingOptions(
					mergeOption(
						normalizeBuildingOptions(data),
						editingRecord?.buildingId,
						editingRecord?.building,
					),
				);
			} finally {
				if (!ignore) setBuildingLoading(false);
			}
		};

		const loadInstances = async () => {
			setInstanceLoading(true);
			try {
				const data = await getThings();
				if (ignore) return;
				setInstanceOptions(
					mergeOption(
						toThingOptions(data),
						editingRecord?.instanceName,
						editingRecord?.instanceName,
					),
				);
			} finally {
				if (!ignore) setInstanceLoading(false);
			}
		};

		loadBuildings();
		loadInstances();
		return () => {
			ignore = true;
		};
	}, [open, editingRecord]);

	useEffect(() => {
		if (!open) return;
		if (!buildingId) {
			setRoomOptions([]);
			return;
		}

		let ignore = false;
		const loadRooms = async () => {
			setRoomLoading(true);
			try {
				const data = await fetchRooms({ buildingId });
				if (ignore) return;
				const sameBuilding =
					editingRecord?.buildingId === buildingId
						? editingRecord
						: null;
				setRoomOptions(
					mergeOption(
						normalizeRoomOptions(data),
						sameBuilding?.roomId,
						sameBuilding?.room,
					),
				);
			} finally {
				if (!ignore) setRoomLoading(false);
			}
		};

		loadRooms();
		return () => {
			ignore = true;
		};
	}, [open, buildingId, editingRecord]);

	useEffect(() => {
		if (!open) return;
		if (!buildingId) {
			setDeviceOptions([]);
			return;
		}

		let ignore = false;
		const loadDeviceOptions = async () => {
			setDeviceLoading(true);
			try {
				const data = await listDevices(buildingId);
				if (ignore) return;
				const sameBuilding =
					editingRecord?.buildingId === buildingId
						? editingRecord
						: null;
				const roomName =
					sameBuilding && sameBuilding.room === room
						? room
						: room || undefined;
				let options = normalizeDeviceOptions(data, roomName);
				if (roomName && options.length === 0) {
					options = normalizeDeviceOptions(data);
				}
				setDeviceOptions(
					mergeOption(
						options,
						sameBuilding?.deviceName,
						sameBuilding?.deviceName,
					),
				);
			} finally {
				if (!ignore) setDeviceLoading(false);
			}
		};

		loadDeviceOptions();
		return () => {
			ignore = true;
		};
	}, [open, buildingId, room, editingRecord]);

	useEffect(() => {
		if (!open) return;
		if (!instanceName) {
			setPointOptions([]);
			return;
		}

		let ignore = false;
		const loadPoints = async () => {
			setPointLoading(true);
			try {
				const data = await getControllable(instanceName);
				if (ignore) return;
				const sameInstance =
					editingRecord?.instanceName === instanceName
						? editingRecord
						: null;
				setPointOptions(
					mergeOption(
						toPropertyOptions(data),
						sameInstance?.pointName,
						sameInstance?.propertyName ?? sameInstance?.pointName,
					),
				);
			} finally {
				if (!ignore) setPointLoading(false);
			}
		};

		loadPoints();
		return () => {
			ignore = true;
		};
	}, [open, instanceName, editingRecord]);

	const handleBuildingChange = (
		value: string,
		option?: SelectOption | SelectOption[],
	) => {
		const selected = Array.isArray(option) ? option[0] : option;
		form.setFieldsValue({
			buildingId: value,
			building: selected?.label,
			roomId: undefined,
			room: undefined,
			deviceName: undefined,
		});
	};

	const handleRoomChange = (
		value: string,
		option?: SelectOption | SelectOption[],
	) => {
		const selected = Array.isArray(option) ? option[0] : option;
		form.setFieldsValue({
			roomId: value,
			room: selected?.label,
			deviceName: undefined,
		});
	};

	const handleInstanceChange = () => {
		form.setFieldsValue({
			pointName: undefined,
			propertyName: undefined,
		});
	};

	const handlePointChange = (
		value: string,
		option?: SelectOption | SelectOption[],
	) => {
		const selected = Array.isArray(option) ? option[0] : option;
		form.setFieldsValue({
			pointName: value,
			propertyName: selected?.label,
		});
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			if (values.thresholdMin > values.thresholdMax) {
				form.setFields([
					{
						name: "thresholdMax",
						errors: ["上限不能小于下限"],
					},
				]);
				return;
			}

			const building =
				values.building ||
				buildingOptions.find((item) => item.value === values.buildingId)
					?.label ||
				"";
			const roomName =
				values.room ||
				roomOptions.find((item) => item.value === values.roomId)
					?.label ||
				"";
			const propertyName =
				values.propertyName ||
				pointOptions.find((item) => item.value === values.pointName)
					?.label ||
				values.pointName;

			setLoading(true);
			await onSubmit({
				...values,
				building,
				room: roomName,
				propertyName,
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
			title={isEdit ? "编辑规则" : "新增规则"}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			destroyOnHidden
			width={560}
			okText={isEdit ? "确定" : "创建规则"}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 5 }}
				wrapperCol={{ span: 19 }}
				preserve={false}
				className={styles.ruleForm}
			>
				<Form.Item
					name="name"
					label="规则名称"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "请输入规则名称",
						},
						{
							max: MAX_LENGTH_12,
							message: `最多输入${MAX_LENGTH_12}个汉字`,
						},
					]}
				>
					<Input
						maxLength={MAX_LENGTH_12}
						placeholder="请输入规则名称"
						showCount
					/>
				</Form.Item>

				<Form.Item
					label="所属房间"
					required
					className={styles.compositeFormItem}
				>
					<div className={styles.roomSelects}>
						<Form.Item
							name="buildingId"
							rules={[{ required: true, message: "请选择厂房" }]}
							className={styles.inlineFormItem}
						>
							<Select
								showSearch
								optionFilterProp="label"
								placeholder="请选择厂房"
								options={buildingOptions}
								loading={buildingLoading}
								allowClear
								onChange={handleBuildingChange}
							/>
						</Form.Item>
						<Form.Item name="building" hidden>
							<Input />
						</Form.Item>
						<Form.Item
							name="roomId"
							rules={[{ required: true, message: "请选择房间" }]}
							className={styles.inlineFormItem}
						>
							<Select
								showSearch
								optionFilterProp="label"
								placeholder="请选择房间"
								options={roomOptions}
								loading={roomLoading}
								disabled={!buildingId}
								allowClear
								onChange={handleRoomChange}
							/>
						</Form.Item>
						<Form.Item name="room" hidden>
							<Input />
						</Form.Item>
					</div>
				</Form.Item>

				<Form.Item
					name="deviceName"
					label="设备名称"
					rules={[{ required: true, message: "请选择设备" }]}
				>
					<Select
						showSearch
						optionFilterProp="label"
						placeholder={buildingId ? "请选择设备" : "请先选择厂房"}
						options={deviceOptions}
						loading={deviceLoading}
						disabled={!buildingId}
						allowClear
					/>
				</Form.Item>

				<Form.Item
					name="instanceName"
					label="实例名称"
					rules={[{ required: true, message: "请选择实例" }]}
				>
					<Select
						showSearch
						optionFilterProp="label"
						placeholder="请选择实例"
						options={instanceOptions}
						loading={instanceLoading}
						allowClear
						onChange={handleInstanceChange}
					/>
				</Form.Item>

				<Form.Item
					name="pointName"
					label="点位名称"
					rules={[{ required: true, message: "请选择点位" }]}
				>
					<Select
						showSearch
						optionFilterProp="label"
						placeholder={
							instanceName ? "请选择点位" : "请先选择实例"
						}
						options={pointOptions}
						loading={pointLoading}
						disabled={!instanceName}
						allowClear
						onChange={handlePointChange}
					/>
				</Form.Item>
				<Form.Item name="propertyName" hidden>
					<Input />
				</Form.Item>

				<Form.Item
					label="报警阈值"
					required
					className={styles.compositeFormItem}
				>
					<div className={styles.thresholdRange}>
						<Form.Item
							name="thresholdMin"
							rules={[
								{ required: true, message: "请输入下限" },
								{
									type: "number",
									min: THRESHOLD_MIN,
									max: THRESHOLD_MAX,
									message: `请输入${THRESHOLD_MIN}-${THRESHOLD_MAX}之间的数字`,
								},
							]}
							className={styles.inlineFormItem}
						>
							<InputNumber
								className={styles.thresholdInput}
								placeholder="请输入下限"
								min={THRESHOLD_MIN}
								max={THRESHOLD_MAX}
								precision={2}
							/>
						</Form.Item>
						<span className={styles.thresholdDivider}>-</span>
						<Form.Item
							name="thresholdMax"
							rules={[
								{ required: true, message: "请输入上限" },
								{
									type: "number",
									min: THRESHOLD_MIN,
									max: THRESHOLD_MAX,
									message: `请输入${THRESHOLD_MIN}-${THRESHOLD_MAX}之间的数字`,
								},
							]}
							className={styles.inlineFormItem}
						>
							<InputNumber
								className={styles.thresholdInput}
								placeholder="请输入上限"
								min={THRESHOLD_MIN}
								max={THRESHOLD_MAX}
								precision={2}
							/>
						</Form.Item>
					</div>
				</Form.Item>

				<Form.Item
					name="levelId"
					label="绑定等级"
					rules={[{ required: true, message: "请选择绑定等级" }]}
				>
					<Select
						placeholder="请选择绑定等级"
						options={levelOptions}
					/>
				</Form.Item>

				<Form.Item
					name="enabled"
					label="是否启用"
					valuePropName="checked"
				>
					<Switch />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
