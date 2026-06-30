import {
	AppstoreOutlined,
	CheckCircleOutlined,
	PoweroffOutlined,
	ThunderboltOutlined,
} from "@ant-design/icons";
import {
	App,
	Button,
	Card,
	Segmented,
	Space,
	Statistic,
	Switch,
	Tag,
	Typography,
} from "antd";
import { useState } from "react";
import styles from "./index.module.css";
import {
	buildInitialState,
	type ControlPoint,
	type ControlState,
	countEnabledPoints,
	countTotalPoints,
	type FactoryPanel,
	getPointIds,
} from "./utils";

const ControlPanel = () => {
	const { message } = App.useApp();
	const [activeFactory, setActiveFactory] = useState("");
	const [controlState, setControlState] = useState<ControlState>(() =>
		buildInitialState([]),
	);

	// activePanel 类型保留 FactoryPanel 以兼容未来接入真实数据后的结构
	const activePanel = ([] as FactoryPanel[])[0]; // FactoryPanel | undefined

	const handlePointToggle = (point: ControlPoint) => {
		const nextChecked = !controlState[point.id];
		setControlState((prev) => ({
			...prev,
			[point.id]: nextChecked,
		}));
		message.success(`${point.name}${nextChecked ? "已开启" : "已关闭"}`);
	};

	const handleFactoryToggle = (checked: boolean) => {
		if (!activePanel) return;
		const pointIds = getPointIds(activePanel);
		setControlState((prev) => {
			const nextState = { ...prev };
			pointIds.forEach((id) => {
				nextState[id] = checked;
			});
			return nextState;
		});
		message.success(
			`${activePanel.label}全部设备${checked ? "已开启" : "已关闭"}`,
		);
	};

	const isCurrentFactoryAllEnabled = activePanel
		? getPointIds(activePanel).every((id) => controlState[id])
		: false;
	const activePointCount = activePanel
		? countEnabledPoints(activePanel, controlState)
		: 0;
	const totalPointCount = activePanel ? countTotalPoints(activePanel) : 0;

	return (
		<div className={styles.controlPanel}>
			<section className={styles.overviewPanel}>
				<div className={styles.overviewMain}>
					<div className={styles.panelTitle}>
						<span className={styles.panelIcon} aria-hidden />
						设备控制面板
					</div>
					<Typography.Paragraph className={styles.panelDesc}>
						按厂区集中管理设备点位开关状态，支持单点控制与当前厂区一键启停。
					</Typography.Paragraph>
					<Segmented
						className={styles.factorySegment}
						value={activeFactory}
						options={[]}
						onChange={(value) => setActiveFactory(String(value))}
					/>
				</div>
				<div className={styles.overviewStats}>
					<Statistic
						title="当前区域"
						value={activePanel?.location ?? "-"}
					/>
					<Statistic
						title="设备分组"
						value={activePanel?.devices.length ?? 0}
					/>
					<Statistic
						title="运行点位"
						value={`${activePointCount}/${totalPointCount}`}
					/>
					<div className={styles.allSwitch}>
						<span>当前厂区全开</span>
						<Switch
							checked={isCurrentFactoryAllEnabled}
							checkedChildren="开"
							unCheckedChildren="关"
							onChange={handleFactoryToggle}
						/>
					</div>
				</div>
			</section>

			<section className={styles.controlBody}>
				<div className={styles.bodyHeader}>
					<div>
						<div className={styles.sectionTitle}>
							{activePanel?.label ?? ""}设备控制
						</div>
						<div className={styles.sectionDesc}>
							点击卡片中的控制按钮可切换点位开关状态
						</div>
					</div>
					<Tag
						color={
							isCurrentFactoryAllEnabled
								? "success"
								: "processing"
						}
					>
						{isCurrentFactoryAllEnabled ? "全区已开启" : "部分运行"}
					</Tag>
				</div>

				<div className={styles.deviceGrid}>
					{activePanel?.devices.map((device) => {
						const enabledCount = device.points.filter(
							(point) => controlState[point.id],
						).length;

						return (
							<Card
								key={device.id}
								className={styles.deviceCard}
								title={
									<Space size={8}>
										<AppstoreOutlined />
										<span>{device.name}</span>
									</Space>
								}
								extra={
									<Tag
										color={
											enabledCount > 0
												? "blue"
												: "default"
										}
									>
										{enabledCount}/{device.points.length}{" "}
										运行
									</Tag>
								}
							>
								<div className={styles.pointGrid}>
									{device.points.map((point) => {
										const enabled = controlState[point.id];

										return (
											<div
												key={point.id}
												className={`${styles.pointItem} ${
													enabled
														? styles.pointItemActive
														: ""
												}`}
											>
												<div
													className={styles.pointMeta}
												>
													<span
														className={
															styles.pointIcon
														}
													>
														{enabled ? (
															<CheckCircleOutlined />
														) : (
															<ThunderboltOutlined />
														)}
													</span>
													<span
														className={
															styles.pointName
														}
													>
														{point.name}
													</span>
												</div>
												<Button
													type={
														enabled
															? "primary"
															: "default"
													}
													icon={<PoweroffOutlined />}
													onClick={() =>
														handlePointToggle(point)
													}
												>
													{enabled ? "关闭" : "开启"}
												</Button>
											</div>
										);
									})}
								</div>
							</Card>
						);
					})}
				</div>
			</section>
		</div>
	);
};

export default ControlPanel;
