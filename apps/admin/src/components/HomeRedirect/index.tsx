import { Navigate } from "react-router-dom";
import { getHomePath } from "@/layout/menuConfig";
import { useMenuStore } from "@/layout/menuStore";

/**
 * 根路径重定向：有菜单进首页，无菜单进 403。
 * 须挂在 RequireMenu 之后，保证 menus 已加载。
 */
const HomeRedirect = () => {
	const menus = useMenuStore((state) => state.menus);
	const homePath = getHomePath(menus);
	return <Navigate to={homePath ?? "/403"} replace />;
};

export default HomeRedirect;
