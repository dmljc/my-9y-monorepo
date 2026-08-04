import { request } from "@/utils";
import type { DeptListQuery, SysDept } from "./interface";

export const list = (data: DeptListQuery = {}): Promise<any> => {
	return request.get("/system/dept/list", { params: data });
};

export const create = (data: SysDept): Promise<any> => {
	return request.post("/system/dept", data);
};

export const update = (data: SysDept): Promise<any> => {
	return request.put("/system/dept", data);
};

export const remove = (deptId: string): Promise<any> => {
	return request.delete(`/system/dept/${deptId}`);
};
