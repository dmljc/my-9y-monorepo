import { Form, Input, Modal, Select } from "antd";
import { type UIEvent, useEffect, useRef, useState } from "react";
import { detail, listThings } from "./api";
import styles from "./index.module.css";
import type { DeviceItem, InstanceFormValues, SelectOption } from "./interface";
import {
	mergeSelectOption,
	parseDeviceDetail,
	parseThingIds,
	THING_LIST_LIMIT,
	toThingOptions,
} from "./utils";

const THING_SEARCH_DEBOUNCE_MS = 300;
const POPUP_VIEWPORT_GAP = 8;

const mergeThingOptions = (
	data: unknown,
	prev: SelectOption[],
	selectedIds: string[],
	append = false,
): SelectOption[] => {
	let next = append ? [...prev] : [];
	for (const item of toThingOptions(data)) {
		next = mergeSelectOption(next, item.value, item.label);
	}
	for (const id of selectedIds) {
		next = mergeSelectOption(
			next,
			id,
			prev.find((item) => item.value === id)?.label ?? id,
		);
	}
	return next;
};

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
 * 实例配置弹窗 props。
 */
interface InstanceModalProps {
	/** 是否打开。 */
	open: boolean;
	/** 当前设备。 */
	device: DeviceItem | null;
	/** 页面根层已判定软键盘打开。 */
	keyboardOpen?: boolean;
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
	keyboardOpen = false,
	getContainer,
	onCancel,
	onOk: onOkProp,
}: InstanceModalProps) => {
	const [form] = Form.useForm<InstanceFormValues>();
	const [loading, setLoading] = useState(false);
	const [instanceLoading, setInstanceLoading] = useState(false);
	const [instanceOptions, setInstanceOptions] = useState<SelectOption[]>([]);
	const [selectOpen, setSelectOpen] = useState(false);
	const [popupMaxHeight, setPopupMaxHeight] = useState<number>();
	const [popupPlacement, setPopupPlacement] = useState<
		"bottomLeft" | "topLeft"
	>("bottomLeft");
	const thingsReqRef = useRef(0);
	const keywordRef = useRef("");
	const nextOffsetRef = useRef(0);
	const hasMoreRef = useRef(true);
	const instanceLoadingRef = useRef(false);
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const syncPopupMaxHeight = () => {
		const next = measureSelectPopup();
		if (!next) {
			return;
		}
		setPopupMaxHeight(next.maxHeight);
		setPopupPlacement(next.placement);
	};

	const fetchThings = (keyword: string, append = false) => {
		const text = keyword.trim();
		if (append && (!hasMoreRef.current || instanceLoadingRef.current)) {
			return;
		}

		const offset = append ? nextOffsetRef.current : 0;
		if (!append) {
			keywordRef.current = text;
			nextOffsetRef.current = 0;
			hasMoreRef.current = true;
		}
		const reqId = append ? thingsReqRef.current : ++thingsReqRef.current;
		instanceLoadingRef.current = true;
		setInstanceLoading(true);
		listThings({
			limit: THING_LIST_LIMIT,
			offset,
			keyword: text,
		})
			.then((data) => {
				if (
					reqId !== thingsReqRef.current ||
					text !== keywordRef.current
				) {
					return;
				}
				const selectedIds = parseThingIds(
					form.getFieldValue("thingIds"),
				);
				const pageOptions = toThingOptions(data);
				nextOffsetRef.current = offset + THING_LIST_LIMIT;
				hasMoreRef.current =
					pageOptions.length >= THING_LIST_LIMIT;
				setInstanceOptions((prev) =>
					mergeThingOptions(data, prev, selectedIds, append),
				);
			})
			.finally(() => {
				if (reqId === thingsReqRef.current) {
					instanceLoadingRef.current = false;
					setInstanceLoading(false);
				}
			});
	};

	useEffect(() => {
		if (!open) {
			setInstanceOptions([]);
			setSelectOpen(false);
			setPopupMaxHeight(undefined);
			keywordRef.current = "";
			nextOffsetRef.current = 0;
			hasMoreRef.current = true;
			instanceLoadingRef.current = false;
			thingsReqRef.current += 1;
			window.clearTimeout(searchTimerRef.current);
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
		fetchThings("");
		if (deviceId) {
			detail(deviceId)
				.then((detailData) => {
					if (ignore || !detailData) return;
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
					form.setFieldsValue(next);
					setInstanceOptions((prev) =>
						mergeThingOptions([], prev, parsed.thingIds, true),
					);
				})
				.catch(() => {
					// 详情失败时仍可使用列表中的设备信息配置实例。
				});
		}

		return () => {
			ignore = true;
			window.clearTimeout(searchTimerRef.current);
		};
	}, [open, device?.deviceId]);

	useEffect(() => {
		if (!selectOpen) {
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
	}, [selectOpen, keyboardOpen]);

	useEffect(() => {
		if (!selectOpen) {
			return;
		}
		const popup = document.querySelector(`.${styles.selectPopup}`);
		if (!(popup instanceof HTMLElement)) {
			return;
		}
		const onScroll = () => {
			const isNearBottom =
				popup.scrollTop + popup.clientHeight >=
				popup.scrollHeight - 16;
			if (isNearBottom) fetchThings(keywordRef.current, true);
		};
		popup.addEventListener("scroll", onScroll);
		return () => {
			popup.removeEventListener("scroll", onScroll);
		};
	}, [selectOpen, popupMaxHeight]);

	const handleThingSearch = (raw: string) => {
		window.clearTimeout(searchTimerRef.current);
		const keyword = raw.trim();
		if (!keyword) {
			fetchThings("");
			return;
		}
		searchTimerRef.current = setTimeout(() => {
			fetchThings(keyword);
		}, THING_SEARCH_DEBOUNCE_MS);
	};

	const onClear = () => {
		window.clearTimeout(searchTimerRef.current);
		fetchThings("");
	};

	const onOpenChange = (visible: boolean) => {
		if (!visible) {
			setSelectOpen(false);
			setPopupMaxHeight(undefined);
			window.clearTimeout(searchTimerRef.current);
			if (!keywordRef.current) return;
			fetchThings("");
			return;
		}
		setSelectOpen(true);
		requestAnimationFrame(() => {
			requestAnimationFrame(syncPopupMaxHeight);
		});
	};

	const handlePopupScroll = (event: UIEvent<HTMLDivElement>) => {
		const target = event.currentTarget;
		const isNearBottom =
			target.scrollTop + target.clientHeight >= target.scrollHeight - 16;
		if (isNearBottom) fetchThings(keywordRef.current, true);
	};

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
		classNames: {
			popup: { root: `${styles.selectPopup} ${styles.modalPopup}` },
		},
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
			title="实例配置"
			open={open}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={loading}
			cancelButtonProps={{ disabled: loading }}
			closable={!loading}
			destroyOnHidden
			keyboard={!loading}
			mask={{ closable: !loading }}
			centered={!keyboardOpen}
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
					<Input disabled placeholder="请输入设备名称" />
				</Form.Item>
				<Form.Item name="deviceCode" label="设备编号">
					<Input disabled placeholder="请输入设备编号" />
				</Form.Item>
				<Form.Item name="manufacturer" label="设备厂家">
					<Input disabled placeholder="请输入设备厂家" />
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
						showSearch={{
							filterOption: false,
							onSearch: handleThingSearch,
						}}
						placeholder="请选择实例"
						options={instanceOptions}
						loading={instanceLoading}
						allowClear
						maxTagCount="responsive"
						onClear={onClear}
						onOpenChange={onOpenChange}
						onPopupScroll={handlePopupScroll}
						{...selectPopupProps}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default InstanceModal;
