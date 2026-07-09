import {
	BarChartOutlined,
	BellOutlined,
	ClusterOutlined,
	ControlOutlined,
	DatabaseOutlined,
	FundViewOutlined,
	SafetyOutlined,
	ToolOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { ConfigProvider, Flex, Layout, Menu, Typography } from "antd";
import { type ReactNode, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "./index.module.css";
import {
	getDefaultPathForTop,
	getTopMenuByPath,
	type TopMenuKey,
} from "./menuConfig";
import { useMenuStore } from "./menuStore";
import UserDropdown from "./UserDropdown";

const { Header, Content } = Layout;

const TOP_MENU_ICONS: Record<TopMenuKey, ReactNode> = {
	dashboard: <FundViewOutlined />,
	statistics: <BarChartOutlined />,
	warning: <BellOutlined />,
	device: <ToolOutlined />,
	historicalData: <DatabaseOutlined />,
	modelData: <ClusterOutlined />,
	reverseControl: <ControlOutlined />,
	system: <SafetyOutlined />,
};

const AppLayout = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const menus = useMenuStore((state) => state.menus);
	const activeTop = getTopMenuByPath(location.pathname, menus);

	const topMenuItems = useMemo<MenuProps["items"]>(
		() =>
			menus.map((item) => ({
				key: item.key,
				label: item.label,
				icon: TOP_MENU_ICONS[item.key],
			})),
		[menus],
	);

	const onTopMenuClick: MenuProps["onClick"] = ({ key }) => {
		if (key === "dashboard") {
			window.open(
				getDefaultPathForTop(key as TopMenuKey, menus),
				"_blank",
			);
			return;
		}
		navigate(getDefaultPathForTop(key as TopMenuKey, menus));
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
