import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { DEFAULT_HOME_PATH } from "@/layout/menuConfig";

const Layout = lazy(() => import("@/layout"));
const RequireAuth = lazy(() => import("@/components/RequireAuth"));
const RouteError = lazy(() => import("@/components/RouteError"));
const Login = lazy(() => import("@/pages/login"));
const Home = lazy(() => import("@/pages/home"));
const DeviceControl = lazy(() => import("@/pages/device-control"));
const AddDevice = lazy(() => import("@/pages/add-device"));
const PipelineConfig = lazy(() => import("@/pages/pipeline-config"));
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
								path: "/add-device",
								element: <AddDevice />,
							},
							{
								path: "/pipeline-config",
								element: <PipelineConfig />,
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
