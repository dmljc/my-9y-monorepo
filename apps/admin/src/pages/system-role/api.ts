import { request } from "@/utils";
import type {
	RoleListQuery,
	RolePermissionPayload,
	SysRole,
} from "./interface";

export const list = (data: RoleListQuery): Promise<any> => {
	return request.get("/system/role/list", { params: data });
};

export const getAssignDetail = (id: string): Promise<any> => {
	return request.get(`/system/role/permissionDetail/${id}`);
};

export const create = (data: SysRole): Promise<any> => {
	return request.post("/system/role", data);
};

export const update = (data: SysRole): Promise<any> => {
	return request.put("/system/role", data);
};

export const updatePermissions = (
	data: RolePermissionPayload,
): Promise<any> => {
	return request.put("/system/role/permission", data);
};

export const remove = (id: string): Promise<any> => {
	return request.delete(`/system/role/${id}`);
};
