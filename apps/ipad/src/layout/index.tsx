import { Outlet } from "react-router-dom";
import styles from "./index.module.css";

/**
 * iPad 应用壳层：全屏横屏容器，具体顶栏由各业务页按设计稿自行呈现。
 */
const AppLayout = () => {
	return (
		<div className={styles.appLayout}>
			<Outlet />
		</div>
	);
};

export default AppLayout;
