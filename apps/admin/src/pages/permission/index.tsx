import {
	ApartmentOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu, Typography } from "antd";
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
	description: string;
}

const PERMISSION_MENUS: PermissionMenuItem[] = [
	{
		key: "role",
		label: "角色管理",
		path: "/permission/role",
		icon: <TeamOutlined />,
		description: "维护角色信息与角色授权范围。",
	},
	{
		key: "user",
		label: "用户管理",
		path: "/permission/user",
		icon: <UserOutlined />,
		description: "维护平台用户、账号状态与角色归属。",
	},
	{
		key: "organization",
		label: "组织管理",
		path: "/permission/organization",
		icon: <ApartmentOutlined />,
		description: "维护组织架构、上下级关系与组织基础信息。",
	},
];

function getActiveMenu(pathname: string): PermissionMenuItem {
	return (
		PERMISSION_MENUS.find((item) => pathname.startsWith(item.path)) ??
		PERMISSION_MENUS[0]
	);
}

/** 侧边栏布局，子路由通过 Outlet 渲染内容 */
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

/** 子路由内容面板，根据当前路径展示对应菜单项的标题和描述 */
export const PermissionContent = () => {
	const { pathname } = useLocation();
	const activeMenu = getActiveMenu(pathname);

	return (
		<div className={styles.panel}>
			<Typography.Title level={4} className={styles.title}>
				{activeMenu.label}
			</Typography.Title>
			<Typography.Paragraph className={styles.description}>
				{activeMenu.description}
			</Typography.Paragraph>
		</div>
	);
};

export default Permission;
