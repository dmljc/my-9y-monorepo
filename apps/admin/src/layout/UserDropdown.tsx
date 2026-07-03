import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/user";
import { clearToken } from "@/utils";

const userMenuItems: MenuProps["items"] = [
	{
		key: "logout",
		icon: <LogoutOutlined />,
		label: "退出登录",
	},
];

const UserDropdown = () => {
	const navigate = useNavigate();
	const user = useUserStore((state) => state.user);
	const clearUser = useUserStore((state) => state.clearUser);
	const displayName = user?.nickName || user?.userName || "用户";

	const onMenuClick: MenuProps["onClick"] = ({ key }) => {
		if (key === "logout") {
			clearToken();
			clearUser();
			navigate("/login");
		}
	};

	return (
		<Space size="middle">
			<Dropdown
				menu={{ items: userMenuItems, onClick: onMenuClick }}
				placement="bottomRight"
				trigger={["click"]}
			>
				<Button
					type="text"
					style={{
						display: "inline-flex",
						alignItems: "center",
						height: 46,
						paddingInline: 12,
					}}
				>
					<Space>
						<Avatar size="small" icon={<UserOutlined />} />
						<Typography.Text>{displayName}</Typography.Text>
					</Space>
				</Button>
			</Dropdown>
		</Space>
	);
};

export default UserDropdown;
