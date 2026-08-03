import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import { buildings as fetchBuildings, rooms as fetchRooms } from "./api";
import styles from "./index.module.css";
import type {
	RuleFormValues,
	RuleLevelOption,
	SelectOption,
	WarningRule,
} from "./utils";
import {
	DEVICE_OPTIONS,
	INSTANCE_OPTIONS,
	MAX_LENGTH_12,
	mergeOption,
	normalizeBuildingOptions,
	normalizeRoomOptions,
	POINT_OPTIONS,
	THRESHOLD_MAX,
	THRESHOLD_MIN,
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
	const isEdit = editingRecord !== null;
	const buildingId = Form.useWatch("buildingId", form);

	useEffect(() => {
		if (!open) {
			setBuildingOptions([]);
			setRoomOptions([]);
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

		loadBuildings();
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
			const room =
				values.room ||
				roomOptions.find((item) => item.value === values.roomId)
					?.label ||
				"";

			setLoading(true);
			await onSubmit({ ...values, building, room });
			onCancel();
		} catch (err) {
			if (err && typeof err === "object" && "errorFields" in err) return;
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
			width={560}
			cancelText="取消"
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

				<Form.Item label="所属房间" required>
					<div className={styles.roomSelects}>
						<Form.Item
							name="buildingId"
							noStyle
							rules={[{ required: true, message: "请选择厂房" }]}
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
							noStyle
							rules={[{ required: true, message: "请选择房间" }]}
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
						placeholder="请选择设备"
						options={DEVICE_OPTIONS}
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
						options={INSTANCE_OPTIONS}
						allowClear
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
						placeholder="请选择点位"
						options={POINT_OPTIONS}
						allowClear
					/>
				</Form.Item>

				<Form.Item label="报警阈值" required>
					<div className={styles.thresholdRange}>
						<Form.Item
							name="thresholdMin"
							noStyle
							rules={[
								{ required: true, message: "请输入下限" },
								{
									type: "number",
									min: THRESHOLD_MIN,
									max: THRESHOLD_MAX,
									message: `请输入${THRESHOLD_MIN}-${THRESHOLD_MAX}之间的数字`,
								},
							]}
						>
							<InputNumber
								className={styles.thresholdInput}
								placeholder="下限"
								min={THRESHOLD_MIN}
								max={THRESHOLD_MAX}
								precision={2}
							/>
						</Form.Item>
						<span className={styles.thresholdDivider}>-</span>
						<Form.Item
							name="thresholdMax"
							noStyle
							rules={[
								{ required: true, message: "请输入上限" },
								{
									type: "number",
									min: THRESHOLD_MIN,
									max: THRESHOLD_MAX,
									message: `请输入${THRESHOLD_MIN}-${THRESHOLD_MAX}之间的数字`,
								},
							]}
						>
							<InputNumber
								className={styles.thresholdInput}
								placeholder="上限"
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
					rules={[{ required: true, message: "请选择报警等级" }]}
				>
					<Select placeholder="请选择等级" options={levelOptions} />
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
