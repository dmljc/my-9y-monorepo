import { ClearOutlined } from "@ant-design/icons";
import { App, Switch } from "antd";
import { type CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import activeBg from "@/assets/device-control/active_bg.webp";
import iconBack from "@/assets/device-control/icon-back.webp";
import tabIndicator from "@/assets/device-control/tab-indicator.webp";
import unActiveBg from "@/assets/device-control/un_active_bg.webp";
import UserDropdown from "@/layout/UserDropdown";
import styles from "./index.module.css";
import { BUILDING_TABS, type DeviceItem, getDevicesByBuilding } from "./utils";

/** 设备卡背景：选中 active_bg，未选中 un_active_bg（均为设计稿 304×160）。 */
const THUMB_BG = {
	"--thumb-bg": `url(${unActiveBg})`,
	"--thumb-bg-active": `url(${activeBg})`,
} as CSSProperties;

const DeviceControl = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const [buildingKey, setBuildingKey] = useState(BUILDING_TABS[0].key);
	const [devices, setDevices] = useState<DeviceItem[]>(() =>
		getDevicesByBuilding(BUILDING_TABS[0].key),
	);
	const [selectedId, setSelectedId] = useState(devices[0]?.id ?? "");
	const [masterOn, setMasterOn] = useState(true);

	const selected =
		devices.find((item) => item.id === selectedId) ?? devices[0];

	useEffect(() => {
		const next = getDevicesByBuilding(buildingKey);
		setDevices(next);
		setSelectedId(next[0]?.id ?? "");
	}, [buildingKey]);

	const handleBack = () => {
		navigate("/home");
	};

	const handleMasterChange = (checked: boolean) => {
		setMasterOn(checked);
		message.success(
			checked ? "“厂房名称”总开关已开启" : "“厂房名称”总开关已关闭",
		);
	};

	const handleDeviceSwitch = (checked: boolean) => {
		if (!selected) return;
		setDevices((prev) =>
			prev.map((item) =>
				item.id === selected.id ? { ...item, enabled: checked } : item,
			),
		);
		message.success(checked ? "设备开关已开启" : "设备开关已关闭");
	};

	const handleClean = () => {
		if (!selected) return;
		setDevices((prev) =>
			prev.map((item) =>
				item.id === selected.id ? { ...item, cleaning: true } : item,
			),
		);
		message.success("已下发设备清洗指令");
	};

	return (
		<div
			className={styles.deviceControl}
			data-page="device-control"
			style={THUMB_BG}
		>
			<header className={styles.header}>
				<button
					type="button"
					className={styles.backBtn}
					onClick={handleBack}
					aria-label="返回首页"
				>
					<img
						className={styles.backIcon}
						src={iconBack}
						alt=""
						aria-hidden
						draggable={false}
					/>
					<span className={styles.brand}>
						{import.meta.env.VITE_APP_TITLE}
					</span>
				</button>

				<nav className={styles.tabs} aria-label="厂房切换">
					{BUILDING_TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							className={`${styles.tab} ${buildingKey === tab.key ? styles.tabActive : ""}`}
							onClick={() => setBuildingKey(tab.key)}
						>
							{tab.label}
							{buildingKey === tab.key ? (
								<img
									className={styles.tabIndicator}
									src={tabIndicator}
									alt=""
									aria-hidden
									draggable={false}
								/>
							) : null}
						</button>
					))}
				</nav>

				<div className={styles.headerRight}>
					<span className={styles.masterLabel}>厂房总开关</span>
					<Switch
						checked={masterOn}
						onChange={handleMasterChange}
						className={`${styles.controlSwitch} ${styles.masterSwitch}`}
					/>
					<UserDropdown />
				</div>
			</header>

			<div className={styles.body}>
				<aside className={styles.sidebar}>
					<div className={styles.deviceGrid}>
						{devices.map((device) => {
							const active = selected?.id === device.id;
							return (
								<button
									key={device.id}
									type="button"
									className={`${styles.deviceCard} ${active ? styles.deviceCardActive : ""}`}
									onClick={() => setSelectedId(device.id)}
								>
									<div className={styles.deviceThumb}>
										<span className={styles.deviceCode}>
											{device.code}
										</span>
									</div>
									<span className={styles.deviceName}>
										{device.name}
									</span>
								</button>
							);
						})}
					</div>
				</aside>

				<section className={styles.detail}>
					{selected ? (
						<>
							<div className={styles.detailHeader}>
								<div className={styles.detailHeaderMain}>
									<span className={styles.deviceNameLabel}>
										设备名称
									</span>
									<span className={styles.deviceNameValue}>
										{selected.levelLabel}
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
										onChange={handleDeviceSwitch}
										className={styles.controlSwitch}
										aria-label="开关"
									/>
								</div>
							</div>

							<div className={styles.detailBody}>
								{selected.cleaning ? (
									<div
										className={styles.cleaningStatus}
										role="status"
										aria-live="polite"
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
										<span className={styles.cleaningText}>
											清洗中
										</span>
									</div>
								) : (
									<button
										type="button"
										className={styles.cleanBtn}
										onClick={handleClean}
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
									<div className={styles.metricCard}>
										<div className={styles.metricValue}>
											{selected.temperature.toFixed(1)}
										</div>
										<div className={styles.metricUnit}>
											℃
										</div>
										<div className={styles.metricLabel}>
											温度
										</div>
									</div>
									<div className={styles.metricCard}>
										<div className={styles.metricValue}>
											{selected.flowRate.toFixed(1)}
										</div>
										<div className={styles.metricUnit}>
											L/min
										</div>
										<div className={styles.metricLabel}>
											流量
										</div>
									</div>
								</div>
							</div>
						</>
					) : null}
				</section>
			</div>
		</div>
	);
};

export default DeviceControl;
