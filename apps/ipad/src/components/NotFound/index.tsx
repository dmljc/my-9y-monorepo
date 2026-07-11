import ErrorFallback from "@/components/ErrorFallback";

const NotFound = () => (
	<ErrorFallback status="404" title="404" subTitle="页面不存在" showHome />
);

export default NotFound;
