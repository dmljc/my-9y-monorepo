import { Switch } from "antd";
import { useNavigate } from "react-router-dom";
import iconBack from "@/assets/device-control/icon-back.webp";
import tabIndicator from "@/assets/device-control/tab-indicator.webp";
import UserDropdown from "@/layout/UserDropdown";
import styles from "./BuildingPageHeader.module.css";

/**
 * 厂房 Tab。
 */
export interface BuildingTab {
	key: string;
	label: string;
}

/**
 * 业务页共用顶栏 props。
 */
export interface BuildingPageHeaderProps {
	/** 当前厂房 key。 */
	buildingKey: string;
	/** 厂房 Tab 列表。 */
	buildings: BuildingTab[];
	/** 切换厂房。 */
	onBuildingChange: (key: string) => void;
	/** 厂房总开关状态。 */
	masterOn: boolean;
	/** 厂房总开关变更。 */
	onMasterChange: (checked: boolean) => void;
}

/**
 * 设备控制 / 取样配置等页共用顶栏：返回、厂房 Tab（选中微笑弧线）、总开关、头像。
 */
const BuildingPageHeader = ({
	buildingKey,
	buildings,
	onBuildingChange,
	masterOn,
	onMasterChange,
}: BuildingPageHeaderProps) => {
	const navigate = useNavigate();

	const handleBack = () => {
		navigate("/home");
	};

	return (
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
				{buildings.map((tab) => (
					<button
						key={tab.key}
						type="button"
						className={`${styles.tab} ${buildingKey === tab.key ? styles.tabActive : ""}`}
						onClick={() => onBuildingChange(tab.key)}
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
					onChange={onMasterChange}
					className={`${styles.controlSwitch} ${styles.masterSwitch}`}
				/>
				<UserDropdown />
			</div>
		</header>
	);
};

export default BuildingPageHeader;
