import { request } from "@/utils";

export const getRouters = (): Promise<any> => {
	return request.get("/getRouters");
};
