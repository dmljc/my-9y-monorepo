import {
	AlertOutlined,
	BellOutlined,
	ProfileOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { type ReactNode, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
	getActiveSideMenu,
	getSideMenus,
	type SideMenuItem,
} from "@/layout/menuConfig";
import { useMenuStore } from "@/layout/menuStore";
import styles from "./layout.module.css";

const MENU_ICONS: Record<string, ReactNode> = {
	list: <BellOutlined />,
	rules: <ProfileOutlined />,
	levels: <AlertOutlined />,
};

/** 警告管理模块布局：侧边栏 + 子路由内容 */
const Warning = () => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const menus = useMenuStore((state) => state.menus);
	const fetchMenus = useMenuStore((state) => state.fetchMenus);
	const sideMenus = getSideMenus("warning", menus);
	const activeMenu = getActiveSideMenu("warning", pathname, menus);

	useEffect(() => {
		fetchMenus();
	}, [fetchMenus]);

	const menuItems = useMemo<MenuProps["items"]>(
		() =>
			sideMenus.map((item) => ({
				key: item.key,
				label: item.label,
				icon: MENU_ICONS[item.key],
			})),
		[sideMenus],
	);

	const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
		const target = sideMenus.find((item: SideMenuItem) => item.key === key);
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
					selectedKeys={activeMenu ? [activeMenu.key] : []}
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
