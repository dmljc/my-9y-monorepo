import { Flex, Spin } from "antd";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import ErrorFallback from "@/components/ErrorFallback";
import { useMenuStore } from "@/layout/menuStore";

/**
 * 菜单守卫：确保已拉取 getRouters；无任何菜单权限时跳转 403。
 */
const RequireMenu = () => {
	const location = useLocation();
	const menus = useMenuStore((state) => state.menus);
	const loaded = useMenuStore((state) => state.loaded);
	const loadError = useMenuStore((state) => state.loadError);
	const fetchMenus = useMenuStore((state) => state.fetchMenus);

	useEffect(() => {
		fetchMenus().catch(() => undefined);
	}, []);

	const handleRetry = () => {
		fetchMenus({ force: true }).catch(() => undefined);
	};

	if (loadError) {
		return (
			<ErrorFallback
				status="500"
				title="菜单加载失败"
				subTitle="暂时无法获取您的菜单权限，请稍后重试。"
				onRetry={handleRetry}
				showHome={false}
			/>
		);
	}

	if (!loaded) {
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

	if (menus.length === 0) {
		return (
			<Navigate to="/403" replace state={{ from: location.pathname }} />
		);
	}

	return <Outlet />;
};

export default RequireMenu;
