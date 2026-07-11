import { Button, Flex, Result, type ResultProps } from "antd";
import { useNavigate } from "react-router-dom";

export interface ErrorFallbackProps {
	/** Ant Design Result 状态图标，如 403 / 404 / 500 / error */
	status?: ResultProps["status"];
	title?: string;
	subTitle?: string;
	/** 传入时展示「重新加载」按钮 */
	onRetry?: () => void;
	/** 是否展示「返回首页」，默认 true */
	showHome?: boolean;
}

/**
 * 纯展示型错误页，本身不捕获异常。
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
							<Button onClick={() => navigate("/home")}>
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
