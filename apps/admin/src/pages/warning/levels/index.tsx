import { Typography } from "antd";
import styles from "../layout.module.css";

const WarningLevels = () => {
	return (
		<div className={styles.panel}>
			<Typography.Title level={4} className={styles.title}>
				报警等级管理
			</Typography.Title>
			<Typography.Paragraph className={styles.description}>
				维护报警等级定义、颜色标识与处理优先级。
			</Typography.Paragraph>
		</div>
	);
};

export default WarningLevels;
