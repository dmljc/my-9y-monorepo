import { ExclamationCircleOutlined } from "@ant-design/icons";
import { App } from "antd";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUnauthorizedStore } from "@/stores/unauthorized";
import { useUserStore } from "@/stores/user";
import { clearExpiredSession } from "@/utils/request";

const UnauthorizedModal = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const open = useUnauthorizedStore((state) => state.open);
	const hide = useUnauthorizedStore((state) => state.hide);
	const clearUser = useUserStore((state) => state.clearUser);
	const { modal } = App.useApp();
	const isLoginPage = location.pathname.startsWith("/login");

	useEffect(() => {
		if (isLoginPage) {
			if (open) hide();
			return;
		}
		if (!open) return;

		const instance = modal.confirm({
			title: "登录状态已失效",
			icon: <ExclamationCircleOutlined />,
			content: "登录凭证已过期，请重新登录。",
			okText: "重新登录",
			onOk: () => {
				clearExpiredSession();
				clearUser();
				hide();
				navigate("/login", { replace: true });
			},
			onCancel: hide,
		});

		return () => instance.destroy();
	}, [open, isLoginPage, modal, hide, clearUser, navigate]);

	return null;
};

export default UnauthorizedModal;
