import React from "react";
import ReactDOM from "react-dom/client";
import DemoApp from "./demo/DemoApp";
import "./style.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootEl).render(
	<React.StrictMode>
		<div className="ia-demo-root">
			<DemoApp />
		</div>
	</React.StrictMode>,
);
