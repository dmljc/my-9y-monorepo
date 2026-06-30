import {
	ApiOutlined,
	AppstoreOutlined,
	BarChartOutlined,
	BellOutlined,
	ControlOutlined,
	DatabaseOutlined,
	FolderOutlined,
	FundViewOutlined,
	SafetyOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { ConfigProvider, Flex, Layout, Menu, Typography } from "antd";
import { type ReactNode, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "./index.module.css";
import {
	getDefaultPathForTop,
	getTopMenuByPath,
	TOP_MENUS,
	type TopMenuKey,
} from "./menuConfig";
import UserDropdown from "./UserDropdown";

const { Header, Content } = Layout;

const TOP_MENU_ICONS: Record<TopMenuKey, ReactNode> = {
	dashboard: <FundViewOutlined />,
	statistics: <BarChartOutlined />,
	warning: <BellOutlined />,
	task: <FolderOutlined />,
	device: <DatabaseOutlined />,
	controlPanel: <AppstoreOutlined />,
	reverseControl: <ControlOutlined />,
	system: <ApiOutlined />,
	permission: <SafetyOutlined />,
};

const AppLayout = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const activeTop = getTopMenuByPath(location.pathname);

	const topMenuItems = useMemo<MenuProps["items"]>(
		() =>
			TOP_MENUS.map((item) => ({
				key: item.key,
				label: item.label,
				icon: TOP_MENU_ICONS[item.key],
			})),
		[],
	);

	const onTopMenuClick: MenuProps["onClick"] = ({ key }) => {
		if (key === "dashboard") {
			window.open(getDefaultPathForTop(key as TopMenuKey), "_blank");
			return;
		}
		navigate(getDefaultPathForTop(key as TopMenuKey));
	};

	return (
		<Layout className={styles.appLayout}>
			<Header className={styles.header}>
				<Flex align="center" className={styles.headerInner}>
					<Typography.Title level={4} className={styles.brand}>
						{import.meta.env.VITE_APP_TITLE}
					</Typography.Title>
					<ConfigProvider
						theme={{
							components: {
								Menu: {
									activeBarHeight: 0,
									horizontalItemSelectedBg: "transparent",
									horizontalItemHoverBg: "transparent",
								},
							},
						}}
					>
						<Menu
							className={styles.topMenu}
							mode="horizontal"
							theme="light"
							selectedKeys={[activeTop]}
							items={topMenuItems}
							onClick={onTopMenuClick}
						/>
					</ConfigProvider>
					<UserDropdown />
				</Flex>
			</Header>
			<Content className={styles.content}>
				<Outlet />
			</Content>
		</Layout>
	);
};

export default AppLayout;
