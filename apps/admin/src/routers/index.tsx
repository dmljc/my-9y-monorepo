import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { getDefaultPathForTop } from "@/layout/menuConfig";

const RequireAuth = lazy(() => import("@/components/RequireAuth"));
const RouteError = lazy(() => import("@/components/RouteError"));
const Layout = lazy(() => import("@/layout"));
const Login = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Statistics = lazy(() => import("@/pages/statistics"));
const Warning = lazy(() => import("@/pages/warning"));
const WarningList = lazy(() => import("@/pages/warning-list"));
const WarningHistory = lazy(() => import("@/pages/warning-history"));
const WarningRules = lazy(() => import("@/pages/warning-rules"));
const WarningLevels = lazy(() => import("@/pages/warning-levels"));
const Device = lazy(() => import("@/pages/device"));
const InspectionLedger = lazy(() => import("@/pages/inspection-ledger"));
const ModelData = lazy(() => import("@/pages/model-data"));
const HistoricalData = lazy(() => import("@/pages/historical-data"));
const ReverseControl = lazy(() => import("@/pages/reverse-control"));
const System = lazy(() => import("@/pages/system"));
const SystemRole = lazy(() => import("@/pages/system-role"));
const SystemUser = lazy(() => import("@/pages/system-user"));
const SystemOrganization = lazy(() => import("@/pages/system-organization"));
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
										path: "history",
										element: <WarningHistory />,
									},
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
							{ path: "/model-data", element: <ModelData /> },
							{
								path: "/model-data/history",
								element: <HistoricalData />,
							},
							{
								path: "/reverse-control",
								element: <ReverseControl />,
							},
							{
								path: "/system",
								element: <System />,
								children: [
									{
										index: true,
										element: (
											<Navigate
												to={getDefaultPathForTop(
													"system",
												).replace("/system/", "")}
												replace
											/>
										),
									},
									{
										path: "role",
										element: <SystemRole />,
									},
									{
										path: "user",
										element: <SystemUser />,
									},
									{
										path: "organization",
										element: <SystemOrganization />,
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
