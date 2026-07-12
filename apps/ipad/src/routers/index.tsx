import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import RouteError from "@/components/RouteError";
import { DEFAULT_HOME_PATH } from "@/layout/menuConfig";

const Layout = lazy(() => import("@/layout"));
const Login = lazy(() => import("@/pages/login"));
const Home = lazy(() => import("@/pages/home"));
const DeviceControl = lazy(() => import("@/pages/device-control"));
const SampleConfig = lazy(() => import("@/pages/sample-config"));
const NotFound = lazy(() => import("@/components/NotFound"));

const routes: RouteObject[] = [
	{
		errorElement: <RouteError />,
		children: [
			{
				path: "/login",
				element: <Login />,
			},
			{
				element: <RequireAuth />,
				children: [
					{
						path: "/",
						element: <Navigate to={DEFAULT_HOME_PATH} replace />,
					},
					{
						element: <Layout />,
						children: [
							{ path: "/home", element: <Home /> },
							{
								path: "/device-control",
								element: <DeviceControl />,
							},
							{
								path: "/sample-config",
								element: <SampleConfig />,
							},
						],
					},
					{
						path: "*",
						element: <NotFound />,
					},
				],
			},
		],
	},
];

export default routes;
