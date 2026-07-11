import { Flex, Spin } from "antd";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/user";
import { clearToken, getToken } from "@/utils";

/**
 * 受保护路由守卫：无 token 时重定向至登录页；有 token 时拉取用户信息。
 */
const RequireAuth = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const user = useUserStore((state) => state.user);
	const loading = useUserStore((state) => state.loading);
	const fetchUserInfo = useUserStore((state) => state.fetchUserInfo);
	const restoreUser = useUserStore((state) => state.restoreUser);
	const clearUser = useUserStore((state) => state.clearUser);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const init = async () => {
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
			const ok = await fetchUserInfo();
			if (!ok) {
				clearToken();
				clearUser();
				navigate("/login", { replace: true });
			}
			setReady(true);
		};
		init();
	}, []);

	if (!getToken()) {
		return (
			<Navigate to="/login" replace state={{ from: location.pathname }} />
		);
	}

	if (!ready || (!user && loading)) {
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
