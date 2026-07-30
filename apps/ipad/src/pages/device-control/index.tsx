import { ClearOutlined } from "@ant-design/icons";
import { App, Empty, Switch } from "antd";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import activeBg from "@/assets/device-control/active-bg.webp";
import unActiveBg from "@/assets/device-control/un-active-bg.webp";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import {
	getRealtime,
	listBuildings,
	listRooms,
	switchBuilding,
	switchDevice,
	toggleClean,
} from "./api";
import styles from "./index.module.css";
import type { BuildingTab, DeviceItem } from "./interface";
import {
	deriveMasterOn,
	formatMetric,
	getDisplayMetrics,
	mapRealtimeMetrics,
	normalizeBuildingTabs,
	parseDevicesFromRooms,
	REALTIME_POLL_MS,
} from "./utils";

/** 设备卡背景：选中 active-bg，未选中 un-active-bg（均为设计稿 304×160）。 */
const THUMB_BG = {
	"--thumb-bg": `url(${unActiveBg})`,
	"--thumb-bg-active": `url(${activeBg})`,
} as CSSProperties;

const DeviceControl = () => {
	const { message } = App.useApp();
	const [buildings, setBuildings] = useState<BuildingTab[]>([]);
	const [buildingKey, setBuildingKey] = useState("");
	const [devices, setDevices] = useState<DeviceItem[]>([]);
	const [masterOn, setMasterOn] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	/** 各厂房上次选中的设备 id，切 Tab 回来时恢复。 */
	const [selectedIdByBuilding, setSelectedIdByBuilding] = useState<
		Record<string, number>
	>({});
	const selectedIdRef = useRef<number | null>(null);

	const currentBuilding =
		buildings.find((item) => item.key === buildingKey) ?? null;
	const selectedId = selectedIdByBuilding[buildingKey] ?? null;
	const selected =
		devices.find((item) => item.id === selectedId) ?? devices[0] ?? null;

	selectedIdRef.current = selected?.id ?? null;

	const applyDevices = (buildingKeyNext: string, next: DeviceItem[]) => {
		setDevices((prev) => {
			const metricsById = new Map(
				prev.map((item) => [item.id, item.metrics]),
			);
			return next.map((item) => ({
				...item,
				metrics: metricsById.get(item.id) ?? item.metrics,
			}));
		});
		setMasterOn(deriveMasterOn(next));
		setSelectedIdByBuilding((prev) => {
			const remembered = prev[buildingKeyNext];
			if (remembered && next.some((item) => item.id === remembered)) {
				return prev;
			}
			const fallback = next[0]?.id;
			if (!fallback) {
				const cleared = { ...prev };
				delete cleared[buildingKeyNext];
				return cleared;
			}
			return { ...prev, [buildingKeyNext]: fallback };
		});
	};

	const loadDevices = async (buildingId: number, buildingKeyNext: string) => {
		const data = await listRooms(buildingId);
		applyDevices(buildingKeyNext, parseDevicesFromRooms(data));
	};

	const loadBuildings = async () => {
		const buildingsData = await listBuildings();
		const tabs = normalizeBuildingTabs(buildingsData);
		setBuildings(tabs);
		if (!tabs.length) {
			setBuildingKey("");
			setDevices([]);
			return;
		}
		const nextKey =
			tabs.some((item) => item.key === buildingKey) && buildingKey
				? buildingKey
				: tabs[0].key;
		setBuildingKey(nextKey);
		const tab = tabs.find((item) => item.key === nextKey);
		if (tab) await loadDevices(tab.buildingId, nextKey);
	};

	useEffect(() => {
		void loadBuildings();
	}, []);

	/** 选中设备变化时拉取实时指标，并定时轮询。 */
	useEffect(() => {
		if (!selected?.id) return;

		let cancelled = false;
		const deviceId = selected.id;

		const pullRealtime = async () => {
			try {
				const data = await getRealtime(deviceId);
				if (cancelled || selectedIdRef.current !== deviceId) return;
				const metrics = mapRealtimeMetrics(data);
				setDevices((prev) =>
					prev.map((item) =>
						item.id === deviceId ? { ...item, metrics } : item,
					),
				);
			} catch {
				/* 错误由 request.onError 提示；轮询中断单次即可 */
			}
		};

		void pullRealtime();
		const timer = window.setInterval(() => {
			void pullRealtime();
		}, REALTIME_POLL_MS);

		return () => {
			cancelled = true;
			window.clearInterval(timer);
		};
	}, [selected?.id]);

	const handleBuildingChange = (key: string) => {
		setBuildingKey(key);
		const tab = buildings.find((item) => item.key === key);
		if (tab) void loadDevices(tab.buildingId, key);
	};

	const handleSelectDevice = (id: number) => {
		setSelectedIdByBuilding((prev) => ({
			...prev,
			[buildingKey]: id,
		}));
	};

	const handleMasterChange = async (checked: boolean) => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房");
			return;
		}
		const name = currentBuilding.label;
		setActionLoading(true);
		try {
			await switchBuilding(
				currentBuilding.buildingId,
				checked ? "on" : "off",
			);
			await loadDevices(currentBuilding.buildingId, buildingKey);
			message.success(
				checked
					? `“${name}”厂房总开关已开启`
					: `“${name}”厂房总开关已关闭`,
			);
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeviceSwitch = async (checked: boolean) => {
		if (!selected || !currentBuilding) return;
		setActionLoading(true);
		try {
			await switchDevice(selected.id, checked ? "on" : "off");
			await loadDevices(currentBuilding.buildingId, buildingKey);
			message.success(checked ? "设备开关已开启" : "设备开关已关闭");
		} finally {
			setActionLoading(false);
		}
	};

	const handleClean = async () => {
		if (!selected || !currentBuilding) return;
		const wasCleaning = selected.cleaning;
		setActionLoading(true);
		try {
			await toggleClean(selected.id);
			await loadDevices(currentBuilding.buildingId, buildingKey);
			message.success(
				wasCleaning ? "已取消设备清洗" : "已下发设备清洗指令",
			);
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div
			className={styles.deviceControl}
			data-page="device-control"
			style={THUMB_BG}
		>
			<div className={styles.stage}>
				<BuildingPageHeader
					buildingKey={buildingKey}
					buildings={buildings}
					onBuildingChange={handleBuildingChange}
					masterOn={masterOn}
					onMasterChange={(checked) => {
						void handleMasterChange(checked);
					}}
				/>

				<div className={styles.body}>
					<aside className={styles.sidebar}>
						{devices.length === 0 ? (
							<div className={styles.emptyWrap}>
								<Empty />
							</div>
						) : (
							<div className={styles.deviceGrid}>
								{devices.map((device) => {
									const active = selected?.id === device.id;
									return (
										<button
											key={device.id}
											type="button"
											className={`${styles.deviceCard} ${active ? styles.deviceCardActive : ""}`}
											onClick={() =>
												handleSelectDevice(device.id)
											}
										>
											<div className={styles.deviceThumb}>
												<span
													className={
														styles.deviceCode
													}
												>
													{device.roomLabel}
												</span>
											</div>
											<span className={styles.deviceName}>
												{device.name}
											</span>
										</button>
									);
								})}
							</div>
						)}
					</aside>

					<section className={styles.detail}>
						{selected ? (
							<>
								<div className={styles.detailHeader}>
									<div className={styles.detailHeaderMain}>
										<span
											className={styles.deviceNameLabel}
										>
											设备名称
										</span>
										<span
											className={styles.deviceNameValue}
										>
											{selected.name}
										</span>
										<span className={styles.roomLabel}>
											监控房
										</span>
										<span className={styles.roomValue}>
											{selected.roomLabel}
										</span>
									</div>
									<div className={styles.detailSwitch}>
										<span className={styles.switchLabel}>
											开关
										</span>
										<Switch
											checked={selected.enabled}
											onChange={(checked) => {
												void handleDeviceSwitch(
													checked,
												);
											}}
											disabled={actionLoading}
											className={styles.controlSwitch}
											aria-label="开关"
										/>
									</div>
								</div>

								<div className={styles.detailBody}>
									{selected.cleaning ? (
										<button
											type="button"
											className={styles.cleaningStatus}
											onClick={() => {
												void handleClean();
											}}
											disabled={actionLoading}
											aria-label="取消设备清洗"
										>
											<svg
												className={styles.cleaningIcon}
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 18 18"
												fill="none"
												aria-hidden
											>
												<title>清洗中</title>
												<g fill="#0099AF">
													<circle
														cx="9"
														cy="2.2"
														r="1.7"
													/>
													<circle
														cx="13.8"
														cy="4.2"
														r="1.55"
													/>
													<circle
														cx="15.8"
														cy="9"
														r="1.35"
													/>
													<circle
														cx="13.8"
														cy="13.8"
														r="1.15"
													/>
													<circle
														cx="9"
														cy="15.8"
														r="1"
													/>
													<circle
														cx="4.2"
														cy="13.8"
														r="0.85"
													/>
													<circle
														cx="2.2"
														cy="9"
														r="0.7"
													/>
													<circle
														cx="4.2"
														cy="4.2"
														r="0.55"
													/>
												</g>
											</svg>
											<span
												className={styles.cleaningText}
											>
												清洗中
											</span>
										</button>
									) : (
										<button
											type="button"
											className={styles.cleanBtn}
											onClick={() => {
												void handleClean();
											}}
											disabled={actionLoading}
										>
											<ClearOutlined
												className={styles.cleanIcon}
											/>
											<span className={styles.cleanText}>
												设备清洗
											</span>
										</button>
									)}

									<div className={styles.metricRow}>
										{getDisplayMetrics(
											selected.metrics,
										).map((metric) => (
											<div
												key={metric.key}
												className={styles.metricCard}
											>
												<div
													className={
														styles.metricValue
													}
												>
													{formatMetric(metric.value)}
												</div>
												{metric.unit ? (
													<div
														className={
															styles.metricUnit
														}
													>
														{metric.unit}
													</div>
												) : null}
												<div
													className={
														styles.metricLabel
													}
												>
													{metric.label}
												</div>
											</div>
										))}
									</div>
								</div>
							</>
						) : (
							<div className={styles.emptyWrap}>
								<Empty />
							</div>
						)}
					</section>
				</div>
			</div>
		</div>
	);
};

export default DeviceControl;
