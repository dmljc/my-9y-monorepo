import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown } from "antd";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/user";
import styles from "./UserDropdown.module.css";

const userMenuItems: MenuProps["items"] = [
	{
		key: "logout",
		icon: <LogoutOutlined />,
		label: "退出登录",
	},
];

const UserDropdown = () => {
	const navigate = useNavigate();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const logout = useUserStore((state) => state.logout);
	const user = useUserStore((state) => state.user);
	const displayName = user?.nickName ?? user?.userName ?? "用户";

	const onMenuClick: MenuProps["onClick"] = async ({ key, domEvent }) => {
		if (key !== "logout") return;
		(domEvent.currentTarget as HTMLElement).blur();
		await logout();
		navigate("/login");
	};

	return (
		<Dropdown
			menu={{ items: userMenuItems, onClick: onMenuClick }}
			placement="bottomRight"
			trigger={["click"]}
			classNames={{ root: styles.dropdownOverlay }}
			onOpenChange={(open) => {
				if (!open) {
					triggerRef.current?.blur();
				}
			}}
		>
			<Button ref={triggerRef} type="text" className={styles.trigger}>
				<Avatar icon={<UserOutlined />} className={styles.avatar} />
				<span className={styles.nickname}>{displayName}</span>
			</Button>
		</Dropdown>
	);
};

export default UserDropdown;
