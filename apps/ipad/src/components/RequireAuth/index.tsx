import { Flex, Spin } from "antd";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserStore } from "@/stores/user";
import { clearToken, getToken } from "@/utils";

/**
 * 受保护路由守卫：无 token 时重定向至登录页；有 token 时从本地缓存恢复会话（不调 getInfo）。
 */
const RequireAuth = () => {
	const location = useLocation();
	const user = useUserStore((state) => state.user);
	const restoreUser = useUserStore((state) => state.restoreUser);
	const clearUser = useUserStore((state) => state.clearUser);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		if (!getToken()) {
			setReady(true);
			return;
		}
		if (user) {
			setReady(true);
			return;
		}
		if (restoreUser()) {
			setReady(true);
			return;
		}
		// 有 token 但无本地会话：视为无效登录态，清 token 回登录页
		clearToken();
		clearUser();
		setReady(true);
	}, []);

	if (!getToken()) {
		return (
			<Navigate to="/login" replace state={{ from: location.pathname }} />
		);
	}

	if (!ready) {
		return (
			<Flex
				align="center"
				justify="center"
				style={{ minHeight: "100vh" }}
			>
				<Spin size="large" />
			</Flex>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return <Outlet />;
};

export default RequireAuth;
