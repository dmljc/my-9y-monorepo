/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import RouteError from "@/components/RouteError";
import { getDefaultPathForTop } from "@/layout/menuConfig";

const Layout = lazy(() => import("@/layout"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Statistics = lazy(() => import("@/pages/statistics"));
const Warning = lazy(() => import("@/pages/warning"));
const WarningList = lazy(() => import("@/pages/warning-list"));
const WarningRules = lazy(() => import("@/pages/warning-rules"));
const WarningLevels = lazy(() => import("@/pages/warning-levels"));
const Device = lazy(() => import("@/pages/device"));
const InspectionLedger = lazy(
	() => import("@/pages/inspection-ledger"),
);
const Task = lazy(() => import("@/pages/task"));
const HistoricalData = lazy(() => import("@/pages/historical-data"));
const ModelData = lazy(() => import("@/pages/model-data"));
const ControlPanel = lazy(() => import("@/pages/control-panel"));
const ReverseControl = lazy(() => import("@/pages/reverse-control"));
const System = lazy(() => import("@/pages/system"));
const Permission = lazy(() => import("@/pages/permission"));
const PermissionContent = lazy(() =>
	import("@/pages/permission").then((m) => ({
		default: m.PermissionContent,
	})),
);
const NotFound = lazy(() => import("@/components/NotFound"));
const Forbidden = lazy(() => import("@/components/Forbidden"));
const ServerError = lazy(() => import("@/components/ServerError"));

const routes: RouteObject[] = [
	{
		errorElement: <RouteError />,
		children: [
			{
				path: "/",
				element: (
					<Navigate to={getDefaultPathForTop("warning")} replace />
				),
			},
			{
				path: "/login",
				element: <Login />,
			},
			{
				path: "/dashboard",
				element: <Dashboard />,
			},
			{
				element: <Layout />,
				children: [
					{ path: "/statistics", element: <Statistics /> },
					{
						path: "/warning",
						element: <Warning />,
						children: [
							{
								index: true,
								element: (
									<Navigate
										to={getDefaultPathForTop(
											"warning",
										).replace("/warning/", "")}
										replace
									/>
								),
							},
							{ path: "list", element: <WarningList /> },
							{ path: "rules", element: <WarningRules /> },
							{ path: "levels", element: <WarningLevels /> },
						],
					},
					{
						path: "/device",
						element: <Device />,
						children: [
							{
								index: true,
								element: (
									<Navigate
										to={getDefaultPathForTop(
											"device",
										).replace("/device/", "")}
										replace
									/>
								),
							},
							{
								path: "inspection-ledger",
								element: <InspectionLedger />,
							},
						],
					},
					{ path: "/task", element: <Task /> },
					{ path: "/historical-data", element: <HistoricalData /> },
					{ path: "/model-data", element: <ModelData /> },
					{ path: "/control-panel", element: <ControlPanel /> },
					{ path: "/reverse-control", element: <ReverseControl /> },
					{ path: "/system", element: <System /> },
					{
						path: "/permission",
						element: <Permission />,
						children: [
							{
								index: true,
								element: (
									<Navigate
										to={getDefaultPathForTop(
											"permission",
										).replace("/permission/", "")}
										replace
									/>
								),
							},
							{ path: "role", element: <PermissionContent /> },
							{ path: "user", element: <PermissionContent /> },
							{
								path: "organization",
								element: <PermissionContent />,
							},
						],
					},
				],
			},
			{
				path: "/403",
				element: <Forbidden />,
			},
			{
				path: "/500",
				element: <ServerError />,
			},
			{
				path: "*",
				element: <NotFound />,
			},
		],
	},
];

export default routes;
