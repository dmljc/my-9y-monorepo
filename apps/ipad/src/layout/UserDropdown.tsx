import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown } from "antd";
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
	const logout = useUserStore((state) => state.logout);
	const user = useUserStore((state) => state.user);
	const displayName = user?.nickName ?? user?.userName ?? "";

	const onMenuClick: MenuProps["onClick"] = async ({ key }) => {
		if (key !== "logout") return;
		await logout();
		navigate("/login");
	};

	return (
		<div className={styles.profile}>
			<Dropdown
				menu={{ items: userMenuItems, onClick: onMenuClick }}
				placement="bottomRight"
				trigger={["click"]}
			>
				<Button type="text" className={styles.trigger}>
					<Avatar icon={<UserOutlined />} className={styles.avatar} />
				</Button>
			</Dropdown>
			{displayName ? (
				<span className={styles.nickname}>{displayName}</span>
			) : null}
		</div>
	);
};

export default UserDropdown;
