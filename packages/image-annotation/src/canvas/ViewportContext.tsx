import { createContext, useContext } from "react";
import { EMPTY_VIEWPORT, type ViewportGeometry } from "../core/types";

const ViewportContext = createContext<ViewportGeometry>(EMPTY_VIEWPORT);

export function ViewportProvider({
	value,
	children,
}: {
	value: ViewportGeometry;
	children: React.ReactNode;
}) {
	return (
		<ViewportContext.Provider value={value}>
			{children}
		</ViewportContext.Provider>
	);
}

export function useViewport() {
	return useContext(ViewportContext);
}
