import type { BreadcrumbProps } from "antd";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import styles from "./index.module.css";
import { buildBreadcrumbItems } from "./menuConfig";
import { useMenuStore } from "./menuStore";

const AppBreadcrumb = () => {
	const location = useLocation();
	const menus = useMenuStore((state) => state.menus);
	const navItems = buildBreadcrumbItems(location.pathname, menus);

	if (navItems.length === 0) return null;

	const items: BreadcrumbProps["items"] = navItems.map((item) => ({
		title: item.title,
		path: item.path,
	}));

	const itemRender: BreadcrumbProps["itemRender"] = (
		currentRoute,
		_params,
		routes,
	) => {
		const isLast = currentRoute === routes[routes.length - 1];
		const path =
			currentRoute && "path" in currentRoute
				? currentRoute.path
				: undefined;

		if (isLast || !path) {
			return <span>{currentRoute.title}</span>;
		}

		return <Link to={path}>{currentRoute.title}</Link>;
	};

	return (
		<Breadcrumb
			className={styles.breadcrumb}
			items={items}
			itemRender={itemRender}
		/>
	);
};

export default AppBreadcrumb;
