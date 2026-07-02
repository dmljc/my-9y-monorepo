import { request } from "@/utils/request";
import type { GetInfoResponse, LoginParams, LoginResponse } from "./interface";

export const login = (data: LoginParams): Promise<LoginResponse> => {
	return request.post("/login", data);
};

export const getInfo = (): Promise<GetInfoResponse> => {
	return request.get("/getInfo");
};
