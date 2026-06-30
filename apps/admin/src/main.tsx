import "antd/dist/reset.css";
import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import App from "./App";
import "./styles/global.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
	// 临时关闭 StrictMode（dev 下避免双挂载导致资源重复请求）；上线前恢复并自测
	// <StrictMode>
	<ConfigProvider locale={zhCN}>
		<AntApp>
			<BrowserRouter>
				<ErrorBoundary>
					<App />
				</ErrorBoundary>
			</BrowserRouter>
		</AntApp>
	</ConfigProvider>,
	// </StrictMode>,
);
