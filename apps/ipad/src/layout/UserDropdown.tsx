import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/user";
import { clearToken } from "@/utils";
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
	const clearUser = useUserStore((state) => state.clearUser);

	const onMenuClick: MenuProps["onClick"] = ({ key }) => {
		if (key === "logout") {
			clearToken();
			clearUser();
			navigate("/login");
		}
	};

	return (
		<Dropdown
			menu={{ items: userMenuItems, onClick: onMenuClick }}
			placement="bottomRight"
			trigger={["click"]}
		>
			<Button type="text" className={styles.trigger}>
				<Space size={8}>
					<Avatar
						size={48}
						icon={<UserOutlined />}
						className={styles.avatar}
					/>
				</Space>
			</Button>
		</Dropdown>
	);
};

export default UserDropdown;
