import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AUTH_LOGOUT_EVENT, AUTH_TOKEN_KEY, getToken } from "@/services/auth";

/**
 * 监听 token 变化（退出登录、跨标签页清除、DevTools 手动删除等），无 token 时跳转登录页。
 */
const AuthWatcher = () => {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const redirectToLoginIfNeeded = () => {
			if (location.pathname.startsWith("/login")) return;
			if (!getToken()) {
				navigate("/login", { replace: true });
			}
		};

		const onStorage = (event: StorageEvent) => {
			if (event.key === AUTH_TOKEN_KEY || event.key === null) {
				redirectToLoginIfNeeded();
			}
		};

		window.addEventListener("storage", onStorage);
		window.addEventListener(AUTH_LOGOUT_EVENT, redirectToLoginIfNeeded);
		window.addEventListener("focus", redirectToLoginIfNeeded);

		return () => {
			window.removeEventListener("storage", onStorage);
			window.removeEventListener(
				AUTH_LOGOUT_EVENT,
				redirectToLoginIfNeeded,
			);
			window.removeEventListener("focus", redirectToLoginIfNeeded);
		};
	}, [location.pathname, navigate]);

	return null;
};

export default AuthWatcher;
