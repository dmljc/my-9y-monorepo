import ErrorFallback from "@/components/ErrorFallback";
import { useMenuStore } from "@/layout/menuStore";
import { useUserStore } from "@/stores/user";
import { clearToken } from "@/utils";

/** 403 无权限页 */
const Forbidden = () => {
	const hasMenus = useMenuStore((state) => state.menus.length > 0);
	const clearUser = useUserStore((state) => state.clearUser);
	const clearMenus = useMenuStore((state) => state.clearMenus);

	const handleLogin = () => {
		clearToken();
		clearUser();
		clearMenus();
	};

	return (
		<ErrorFallback
			status="403"
			title="403"
			subTitle={
				hasMenus
					? "抱歉，您没有权限访问此页面。"
					: "您的账号暂未分配菜单权限，请联系管理员。"
			}
			showHome={hasMenus}
			showLogin={!hasMenus}
			onLogin={handleLogin}
		/>
	);
};

export default Forbidden;
