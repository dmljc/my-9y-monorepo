import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import ErrorFallback from "@/components/ErrorFallback";

const getRouteErrorMessage = (error: unknown): string => {
	if (isRouteErrorResponse(error)) {
		if (typeof error.data === "string" && error.data) {
			return error.data;
		}
		if (
			typeof error.data === "object" &&
			error.data !== null &&
			"message" in error.data &&
			typeof (error.data as { message: unknown }).message === "string"
		) {
			return (error.data as { message: string }).message;
		}
		return error.statusText || `请求失败（${error.status}）`;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "路由加载失败，请稍后重试。";
};

const getRouteErrorStatus = (error: unknown): number | undefined => {
	if (isRouteErrorResponse(error)) {
		return error.status;
	}
	return undefined;
};

/** 路由级错误页：配合 errorElement 使用 */
const RouteError = () => {
	const error = useRouteError();
	const httpStatus = getRouteErrorStatus(error);
	const message = getRouteErrorMessage(error);

	const status =
		httpStatus === 403 ? "403" : httpStatus === 404 ? "404" : "error";
	const title =
		httpStatus === 403
			? "403"
			: httpStatus === 404
				? "404"
				: httpStatus === 500
					? "500"
					: "出错了";

	return (
		<ErrorFallback
			status={status}
			title={title}
			subTitle={message}
			onRetry={() => window.location.reload()}
			showHome
		/>
	);
};

export default RouteError;
