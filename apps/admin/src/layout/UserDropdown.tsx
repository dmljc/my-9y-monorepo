import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { clearToken } from "@/services/auth";

const USER_NAME = "ProUser";

const userMenuItems: MenuProps["items"] = [
	{
		key: "logout",
		icon: <LogoutOutlined />,
		label: "退出登录",
	},
];

const UserDropdown = () => {
	const navigate = useNavigate();

	const onMenuClick: MenuProps["onClick"] = ({ key }) => {
		if (key === "logout") {
			clearToken();
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
				<Button type="text">
					<Space>
						<Avatar size="small" icon={<UserOutlined />} />
						<Typography.Text>{USER_NAME}</Typography.Text>
					</Space>
				</Button>
			</Dropdown>
		</Space>
	);
};

export default UserDropdown;
