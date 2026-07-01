import {
	ApartmentOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "./index.module.css";

type PermissionMenuKey = "role" | "user" | "organization";

interface PermissionMenuItem {
	key: PermissionMenuKey;
	label: string;
	path: string;
	icon: ReactNode;
}

const PERMISSION_MENUS: PermissionMenuItem[] = [
	{
		key: "role",
		label: "角色管理",
		path: "/permission/role",
		icon: <TeamOutlined />,
	},
	{
		key: "user",
		label: "用户管理",
		path: "/permission/user",
		icon: <UserOutlined />,
	},
	{
		key: "organization",
		label: "组织管理",
		path: "/permission/organization",
		icon: <ApartmentOutlined />,
	},
];

function getActiveMenu(pathname: string): PermissionMenuItem {
	return (
		PERMISSION_MENUS.find((item) => pathname.startsWith(item.path)) ??
		PERMISSION_MENUS[0]
	);
}

/** 角色权限模块布局：侧边栏 + 子路由内容 */
const Permission = () => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const activeMenu = getActiveMenu(pathname);

	const menuItems = useMemo<MenuProps["items"]>(
		() =>
			PERMISSION_MENUS.map((item) => ({
				key: item.key,
				label: item.label,
				icon: item.icon,
			})),
		[],
	);

	const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
		const target = PERMISSION_MENUS.find((item) => item.key === key);
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

export default Permission;
