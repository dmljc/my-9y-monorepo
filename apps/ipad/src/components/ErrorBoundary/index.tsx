import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorFallback from "@/components/ErrorFallback";

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
}

/**
 * 根级 React 错误边界（须为 class 组件）。
 */
export default class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("[ErrorBoundary]", error, info.componentStack);
	}

	render() {
		const { error } = this.state;
		if (error) {
			return (
				<ErrorFallback
					title="页面出错了"
					subTitle={
						error.message || "应用运行异常，请刷新页面后重试。"
					}
					onRetry={() => window.location.reload()}
					showHome
				/>
			);
		}
		return this.props.children;
	}
}
