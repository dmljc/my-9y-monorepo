import { createHttpClient } from "@utils/http-client";

export const request = createHttpClient({
	baseURL: import.meta.env.VITE_API_BASE_URL,
});
