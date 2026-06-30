import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorFallback from "@/components/ErrorFallback";

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
}

/**
 * 根级 React 错误边界（须为 class 组件，函数组件无法使用 componentDidCatch）。
 *
 * 职责：
 * - 捕获子树渲染阶段抛出的错误（含 lazy() 动态 import 失败）
 * - 作为最后一道兜底，避免整页白屏
 *
 * 与 RouteError（路由 errorElement）的分工：
 * - RouteError：路由匹配范围内的 loader / action / 路由组件错误
 * - ErrorBoundary：App、Suspense 等路由体系外的错误，以及未被 errorElement 覆盖的异常
 *
 * 挂载位置见 main.tsx，需放在 BrowserRouter 内以便降级 UI 可正常跳转。
 */
export default class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	/** 渲染降级 UI 前同步更新 state */
	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	/** 记录堆栈，便于接入 Sentry 等监控 */
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
					// 整页刷新以重新拉取 lazy chunk、重置错误 state
					onRetry={() => window.location.reload()}
					showHome
				/>
			);
		}
		return this.props.children;
	}
}
