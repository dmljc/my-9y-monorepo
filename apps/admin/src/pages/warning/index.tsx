import {
	AlertOutlined,
	BellOutlined,
	ProfileOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { type ReactNode, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "./layout.module.css";

type WarningMenuKey = "list" | "rules" | "levels";

interface WarningMenuItem {
	key: WarningMenuKey;
	label: string;
	path: string;
	icon: ReactNode;
}

const WARNING_MENUS: WarningMenuItem[] = [
	{
		key: "list",
		label: "警告管理",
		path: "/warning/list",
		icon: <BellOutlined />,
	},
	{
		key: "rules",
		label: "警告规则",
		path: "/warning/rules",
		icon: <ProfileOutlined />,
	},
	{
		key: "levels",
		label: "报警等级管理",
		path: "/warning/levels",
		icon: <AlertOutlined />,
	},
];

function getActiveMenu(pathname: string): WarningMenuItem {
	return (
		WARNING_MENUS.find((item) => pathname.startsWith(item.path)) ??
		WARNING_MENUS[0]
	);
}

/** 警告管理模块布局：侧边栏 + 子路由内容 */
const Warning = () => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const activeMenu = getActiveMenu(pathname);

	const menuItems = useMemo<MenuProps["items"]>(
		() =>
			WARNING_MENUS.map((item) => ({
				key: item.key,
				label: item.label,
				icon: item.icon,
			})),
		[],
	);

	const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
		const target = WARNING_MENUS.find((item) => item.key === key);
		if (target) {
			navigate(target.path);
		}
	};

	return (
		<div className={styles.warningLayout}>
			<aside className={styles.sidebar}>
				<Menu
					className={styles.sideMenu}
					mode="inline"
					selectedKeys={[activeMenu.key]}
					items={menuItems}
					onClick={handleMenuClick}
				/>
			</aside>

			<section className={styles.content}>
				<Outlet />
			</section>
		</div>
	);
};

export default Warning;
