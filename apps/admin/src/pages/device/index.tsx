import { FileSearchOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { type ReactNode, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "./layout.module.css";

type DeviceMenuKey = "inspectionLedger";

interface DeviceMenuItem {
	key: DeviceMenuKey;
	label: string;
	path: string;
	icon: ReactNode;
}

const DEVICE_MENUS: DeviceMenuItem[] = [
	{
		key: "inspectionLedger",
		label: "点检台账",
		path: "/device/inspection-ledger",
		icon: <FileSearchOutlined />,
	},
];

function getActiveMenu(pathname: string): DeviceMenuItem {
	return (
		DEVICE_MENUS.find((item) => pathname.startsWith(item.path)) ??
		DEVICE_MENUS[0]
	);
}

/** 设备管理模块布局：侧边栏 + 子路由内容 */
const Device = () => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const activeMenu = getActiveMenu(pathname);

	const menuItems = useMemo<MenuProps["items"]>(
		() =>
			DEVICE_MENUS.map((item) => ({
				key: item.key,
				label: item.label,
				icon: item.icon,
			})),
		[],
	);

	const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
		const target = DEVICE_MENUS.find((item) => item.key === key);
		if (target) {
			navigate(target.path);
		}
	};

	return (
		<div className={styles.deviceLayout}>
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

export default Device;
