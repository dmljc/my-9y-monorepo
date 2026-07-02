import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "@/services/auth";

/**
 * 受保护路由守卫：无 token 时重定向至登录页。
 */
const RequireAuth = () => {
	const location = useLocation();

	if (!getToken()) {
		return (
			<Navigate to="/login" replace state={{ from: location.pathname }} />
		);
	}

	return <Outlet />;
};

export default RequireAuth;
