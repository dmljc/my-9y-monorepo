import type { FC } from "react";
import Dashboard from "./components/Dashboard";

const App: FC = () => {
	return (
		<div className="dashboard-container">
			<Dashboard />
		</div>
	);
};

export default App;
