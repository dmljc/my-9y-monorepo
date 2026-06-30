import { Typography } from "antd";
import styles from "../layout.module.css";

const WarningRules = () => {
	return (
		<div className={styles.panel}>
			<Typography.Title level={4} className={styles.title}>
				警告规则
			</Typography.Title>
			<Typography.Paragraph className={styles.description}>
				配置告警触发条件、阈值规则与通知策略。
			</Typography.Paragraph>
		</div>
	);
};

export default WarningRules;
