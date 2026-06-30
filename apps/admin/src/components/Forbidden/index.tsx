import ErrorFallback from "@/components/ErrorFallback";

/** 403 无权限页 */
const Forbidden = () => (
	<ErrorFallback
		status="403"
		title="403"
		subTitle="抱歉，您没有权限访问此页面。"
		showHome
	/>
);

export default Forbidden;
