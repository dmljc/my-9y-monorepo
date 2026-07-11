import "antd/dist/reset.css";
import { App as AntApp, ConfigProvider } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import zhCN from "antd/locale/zh_CN";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { requestMessageApi } from "@/utils/request";
import App from "./App";
import "./styles/global.css";

const setMessageApi = (api: MessageInstance | null) => {
	requestMessageApi.current = api;
};

/** 将 App.useApp().message 注入 request 全局 onError。 */
const RequestMessageBridge = () => {
	const { message } = AntApp.useApp();

	useEffect(() => {
		setMessageApi(message);
		return () => setMessageApi(null);
	}, [message]);

	return null;
};

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
	<ConfigProvider locale={zhCN}>
		<AntApp>
			<RequestMessageBridge />
			<BrowserRouter>
				<ErrorBoundary>
					<App />
				</ErrorBoundary>
			</BrowserRouter>
		</AntApp>
	</ConfigProvider>,
);
