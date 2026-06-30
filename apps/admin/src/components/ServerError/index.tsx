import ErrorFallback from "@/components/ErrorFallback";

/** 500 服务器错误页 */
const ServerError = () => (
	<ErrorFallback
		status="500"
		title="500"
		subTitle="服务器开小差了，请稍后重试。"
		onRetry={() => window.location.reload()}
		showHome
	/>
);

export default ServerError;
