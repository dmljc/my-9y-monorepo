import {
	ApartmentOutlined,
	FileTextOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { type ReactNode, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
	getActiveSideMenu,
	getSideMenus,
	type SideMenuItem,
} from "@/layout/menuConfig";
import { useMenuStore } from "@/layout/menuStore";
import styles from "./index.module.css";

const MENU_ICONS: Record<string, ReactNode> = {
	role: <TeamOutlined />,
	user: <UserOutlined />,
	organization: <ApartmentOutlined />,
	operationLog: <FileTextOutlined />,
};

/** 角色权限模块布局：侧边栏 + 子路由内容 */
const Permission = () => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const menus = useMenuStore((state) => state.menus);
	const sideMenus = getSideMenus("system", menus);
	const activeMenu = getActiveSideMenu("system", pathname, menus);

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
		<div className={styles.permission}>
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

export default Permission;
