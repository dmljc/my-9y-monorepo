import {
	BarChartOutlined,
	BellOutlined,
	ClusterOutlined,
	ControlOutlined,
	FundViewOutlined,
	SafetyOutlined,
	ToolOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { App, ConfigProvider, Flex, Layout, Menu, Typography } from "antd";
import { type ReactNode, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { isTabletDevice } from "@/utils";
import AppBreadcrumb from "./AppBreadcrumb";
import styles from "./index.module.css";
import {
	buildBreadcrumbItems,
	DASHBOARD_EXTERNAL_URL,
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
	modelData: <ClusterOutlined />,
	reverseControl: <ControlOutlined />,
	system: <SafetyOutlined />,
};

const AppLayout = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { modal } = App.useApp();
	const menus = useMenuStore((state) => state.menus);
	const activeTop = getTopMenuByPath(location.pathname, menus);
	const showBreadcrumb =
		buildBreadcrumbItems(location.pathname, menus).length > 0;

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
			if (isTabletDevice()) {
				modal.warning({
					title: "不支持在平板访问大屏",
					content: "大屏对硬件的性能要求较高，请使用电脑浏览器打开。",
				});
				return;
			}
			window.open(DASHBOARD_EXTERNAL_URL, "_blank", "noopener,noreferrer");
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
			<Content
				className={`${styles.content}${showBreadcrumb ? ` ${styles.contentWithBreadcrumb}` : ""}`}
			>
				<AppBreadcrumb />
				<Outlet />
			</Content>
		</Layout>
	);
};

export default AppLayout;
