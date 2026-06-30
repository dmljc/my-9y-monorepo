import { Button, Flex, Result, type ResultProps } from "antd";
import { useNavigate } from "react-router-dom";
import { getDefaultPathForTop } from "@/layout/menuConfig";

export interface ErrorFallbackProps {
	/** Ant Design Result 状态图标，如 403 / 404 / 500 / error */
	status?: ResultProps["status"];
	title?: string;
	subTitle?: string;
	/** 传入时展示「重新加载」按钮（通常绑定 window.location.reload） */
	onRetry?: () => void;
	/** 是否展示「返回首页」，默认 true */
	showHome?: boolean;
}

/**
 * 纯展示型错误页，本身不捕获异常。
 *
 * 使用场景：
 * - ErrorBoundary 捕获错误后的降级 UI
 * - RouteError（路由 errorElement）
 * - Forbidden / ServerError 等静态错误页
 *
 * 依赖 react-router 的 useNavigate，须渲染在 BrowserRouter 内部。
 */
const ErrorFallback = ({
	status = "error",
	title = "出错了",
	subTitle = "页面加载或运行异常，请稍后重试。",
	onRetry,
	showHome = true,
}: ErrorFallbackProps) => {
	const navigate = useNavigate();

	return (
		<Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
			<Result
				status={status}
				title={title}
				subTitle={subTitle}
				extra={
					<Flex gap="small" justify="center">
						{onRetry ? (
							<Button type="primary" onClick={onRetry}>
								重新加载
							</Button>
						) : null}
						{showHome ? (
							<Button
								onClick={() =>
									navigate(getDefaultPathForTop("warning"))
								}
							>
								返回首页
							</Button>
						) : null}
					</Flex>
				}
			/>
		</Flex>
	);
};

export default ErrorFallback;
