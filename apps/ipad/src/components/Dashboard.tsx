import type { FC } from "react";
import { containerStyle, wrapperStyle } from "./style";

const Dashboard: FC = () => {
	return (
		<div style={wrapperStyle}>
			<div style={containerStyle}>可视化大屏</div>
		</div>
	);
};

export default Dashboard;
