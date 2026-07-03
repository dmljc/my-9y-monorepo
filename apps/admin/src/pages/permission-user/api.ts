import { request } from "@/utils";
import type { SysUser, UserListQuery } from "./interface";

export const list = (data: UserListQuery): Promise<any> => {
	return request.get("/system/user/list", { params: data });
};

export const detail = (id: string): Promise<any> => {
	return request.get(`/system/user/${id}`);
};

export const create = (data: SysUser): Promise<any> => {
	return request.post("/system/user", data);
};

export const update = (data: SysUser): Promise<any> => {
	return request.put("/system/user", data);
};

export const remove = (id: string): Promise<any> => {
	return request.delete(`/system/user/${id}`);
};

export const getDeptTree = (): Promise<any> => {
	return request.get("/system/user/deptTree");
};

export const listRoles = (data: {
	pageNum: number;
	pageSize: number;
}): Promise<any> => {
	return request.get("/system/role/list", { params: data });
};
