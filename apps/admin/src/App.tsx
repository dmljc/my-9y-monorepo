import { Flex, Spin } from "antd";
import { Suspense, useEffect } from "react";
import { useLocation, useRoutes } from "react-router-dom";
import AuthWatcher from "@/components/AuthWatcher";
import { getDocumentTitle } from "@/layout/menuConfig";
import routes from "@/routers";

const RouteLoading = () => (
	<Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
		<Spin size="large" />
	</Flex>
);

const AppRoutes = () => {
	const location = useLocation();

	useEffect(() => {
		document.title = getDocumentTitle(location.pathname);
	}, [location.pathname]);

	return (
		<>
			<AuthWatcher />
			{useRoutes(routes)}
		</>
	);
};

const App = () => (
	<Suspense fallback={<RouteLoading />}>
		<AppRoutes />
	</Suspense>
);

export default App;
