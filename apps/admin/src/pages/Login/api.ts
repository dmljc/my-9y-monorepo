import { request } from "@/services/request";
import type { LoginParams, LoginResponse } from "./interface";

export const login = (data: LoginParams): Promise<LoginResponse> => {
	return request.post("/login", data);
};
