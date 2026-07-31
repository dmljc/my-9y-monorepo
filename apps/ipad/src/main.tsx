import "antd/dist/reset.css";
import { App as AntApp, ConfigProvider } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import zhCN from "antd/locale/zh_CN";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import UnauthorizedModal from "@/components/UnauthorizedModal";
import { requestMessageApi } from "@/utils/request";
import App from "./App";
import "./styles/global.css";

const setMessageApi = (message: MessageInstance | null) => {
	requestMessageApi.current = message;
};

/** 将 App.useApp() 注入 request 全局反馈。 */
const RequestMessageBridge = () => {
	const { message } = AntApp.useApp();

	setMessageApi(message);

	useEffect(() => {
		return () => setMessageApi(null);
	}, []);

	return null;
};

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
	<ConfigProvider locale={zhCN}>
		<AntApp>
			<BrowserRouter>
				<RequestMessageBridge />
				<UnauthorizedModal />
				<ErrorBoundary>
					<App />
				</ErrorBoundary>
			</BrowserRouter>
		</AntApp>
	</ConfigProvider>,
);
