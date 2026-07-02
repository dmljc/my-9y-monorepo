import { createHttpClient } from "@utils/http-client";
import { clearToken, getToken } from "./auth";

export const request = createHttpClient({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	getToken: () => getToken(),
	onUnauthorized: () => {
		clearToken();
		if (!window.location.pathname.startsWith("/login")) {
			window.location.href = "/login";
		}
	},
});
