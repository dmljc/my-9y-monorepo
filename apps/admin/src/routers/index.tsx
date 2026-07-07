import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
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
const InspectionLedger = lazy(() => import("@/pages/inspection-ledger"));
const HistoricalData = lazy(() => import("@/pages/historical-data"));
const ModelData = lazy(() => import("@/pages/model-data"));
const ReverseControl = lazy(() => import("@/pages/reverse-control"));
const Permission = lazy(() => import("@/pages/permission"));
const PermissionRole = lazy(() => import("@/pages/permission-role"));
const PermissionUser = lazy(() => import("@/pages/permission-user"));
const PermissionOrganization = lazy(
	() => import("@/pages/permission-organization"),
);
const OperationLog = lazy(() => import("@/pages/operation-log"));
const NotFound = lazy(() => import("@/components/NotFound"));
const Forbidden = lazy(() => import("@/components/Forbidden"));
const ServerError = lazy(() => import("@/components/ServerError"));

const routes: RouteObject[] = [
	{
		errorElement: <RouteError />,
		children: [
			{
				path: "/login",
				element: <Login />,
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
				element: <RequireAuth />,
				children: [
					{
						path: "/",
						element: (
							<Navigate
								to={getDefaultPathForTop("warning")}
								replace
							/>
						),
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
									{
										path: "rules",
										element: <WarningRules />,
									},
									{
										path: "levels",
										element: <WarningLevels />,
									},
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
							{
								path: "/historical-data",
								element: <HistoricalData />,
							},
							{ path: "/model-data", element: <ModelData /> },
							{
								path: "/reverse-control",
								element: <ReverseControl />,
							},
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
									{
										path: "role",
										element: <PermissionRole />,
									},
									{
										path: "user",
										element: <PermissionUser />,
									},
									{
										path: "organization",
										element: <PermissionOrganization />,
									},
									{
										path: "operation-log",
										element: <OperationLog />,
									},
								],
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
