import { LoadingOutlined } from "@ant-design/icons";
import { Form, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { listAlarmRooms } from "./api";
import styles from "./index.module.css";
import type {
	PipelineFormValues,
	PipelineItem,
	RoomOption,
} from "./interface";
import {
	buildRoomOptions,
	normalizePipeInValue,
	PIPE_IN_OPTIONS,
} from "./utils";

type OpenSelect = "room" | "pipe" | null;

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
	/** 页面根层已判定软键盘打开。 */
	keyboardOpen?: boolean;
	/** 弹窗挂载容器。 */
	getContainer: () => HTMLElement;
	/** 取消。 */
	onCancel: () => void;
	/** 确定提交。 */
	onOk: (values: PipelineFormValues) => Promise<void>;
}

const POPUP_VIEWPORT_GAP = 8;

/**
 * 按 visualViewport 计算下拉高度，并选空间更大的一侧展开。
 */
const measureSelectPopup = () => {
	const trigger = document.querySelector(
		`.${styles.modal} .ant-select-open`,
	);
	if (!(trigger instanceof HTMLElement)) {
		return undefined;
	}
	const viewport = window.visualViewport;
	const rect = trigger.getBoundingClientRect();
	const vvTop = viewport?.offsetTop ?? 0;
	const vvBottom = vvTop + (viewport?.height ?? window.innerHeight);
	const below = vvBottom - rect.bottom - POPUP_VIEWPORT_GAP;
	const above = rect.top - vvTop - POPUP_VIEWPORT_GAP;
	if (below >= above) {
		return {
			maxHeight: Math.max(Math.floor(below), 0),
			placement: "bottomLeft" as const,
		};
	}
	return {
		maxHeight: Math.max(Math.floor(above), 0),
		placement: "topLeft" as const,
	};
};

/**
 * 新增 / 编辑房间管道配置弹窗。
 */
const CreateModal = ({
	open,
	editingRecord,
	buildingId,
	keyboardOpen = false,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: CreateModalProps) => {
	const [form] = Form.useForm<PipelineFormValues>();
	const [loading, setLoading] = useState(false);
	const [roomLoading, setRoomLoading] = useState(false);
	const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
	const [openSelect, setOpenSelect] = useState<OpenSelect>(null);
	const [popupMaxHeight, setPopupMaxHeight] = useState<number>();
	const [popupPlacement, setPopupPlacement] = useState<
		"bottomLeft" | "topLeft"
	>("bottomLeft");
	const isEdit = editingRecord !== null;
	const pickerOpen = openSelect !== null;

	const syncPopupMaxHeight = () => {
		const next = measureSelectPopup();
		if (!next) {
			return;
		}
		setPopupMaxHeight(next.maxHeight);
		setPopupPlacement(next.placement);
	};

	const onSelectOpenChange =
		(key: Exclude<OpenSelect, null>) => (visible: boolean) => {
			if (!visible) {
				setOpenSelect((current) => (current === key ? null : current));
				setPopupMaxHeight(undefined);
				return;
			}
			setOpenSelect(key);
			requestAnimationFrame(() => {
				requestAnimationFrame(syncPopupMaxHeight);
			});
		};

	useEffect(() => {
		if (!open) {
			setLoading(false);
			setRoomOptions([]);
			setOpenSelect(null);
			setPopupMaxHeight(undefined);
			return;
		}
		if (editingRecord) {
			form.setFieldsValue({
				roomId: String(editingRecord.roomId ?? ""),
				room: editingRecord.sampleRoom,
				pipeIn: normalizePipeInValue(editingRecord.pipeIn) || undefined,
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

	useEffect(() => {
		if (!pickerOpen) {
			return;
		}
		const viewport = window.visualViewport;
		const onResize = () => syncPopupMaxHeight();
		const measureFrame = requestAnimationFrame(() => {
			requestAnimationFrame(syncPopupMaxHeight);
		});
		viewport?.addEventListener("resize", onResize);
		viewport?.addEventListener("scroll", onResize);
		window.addEventListener("resize", onResize);
		return () => {
			cancelAnimationFrame(measureFrame);
			viewport?.removeEventListener("resize", onResize);
			viewport?.removeEventListener("scroll", onResize);
			window.removeEventListener("resize", onResize);
		};
	}, [pickerOpen, keyboardOpen]);

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

	const selectPopupProps = {
		virtual: false as const,
		listHeight: popupMaxHeight ?? 256,
		getPopupContainer: getContainer,
		classNames: { popup: { root: styles.selectPopup } },
		styles: popupMaxHeight
			? {
					popup: {
						root: {
							["--select-popup-max-height" as string]: `${popupMaxHeight}px`,
						},
					},
				}
			: undefined,
		placement: keyboardOpen ? popupPlacement : undefined,
		builtinPlacements: keyboardOpen
			? {
					bottomLeft: {
						points: ["tl", "bl"] as [string, string],
						offset: [0, 4],
						overflow: {
							adjustX: true,
							adjustY: false,
							shiftY: false,
						},
					},
					topLeft: {
						points: ["bl", "tl"] as [string, string],
						offset: [0, -4],
						overflow: {
							adjustX: true,
							adjustY: false,
							shiftY: false,
						},
					},
				}
			: undefined,
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
			okButtonProps={{ icon: loading ? <LoadingOutlined /> : undefined }}
			cancelButtonProps={{ disabled: loading }}
			closable={!loading}
			destroyOnHidden
			keyboard={!loading}
			mask={{ closable: !loading }}
			centered={!keyboardOpen}
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
						{...selectPopupProps}
						showSearch={{ optionFilterProp: "label" }}
						onOpenChange={onSelectOpenChange("room")}
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
						{...selectPopupProps}
						showSearch={{ optionFilterProp: "label" }}
						onOpenChange={onSelectOpenChange("pipe")}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateModal;
