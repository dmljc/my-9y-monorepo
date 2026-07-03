import { request } from "@/utils";
import type {
	RoleListQuery,
	RolePermissionPayload,
	SysRole,
} from "./interface";

export const list = (data: RoleListQuery): Promise<any> => {
	return request.get("/system/role/list", { params: data });
};

export const detail = (id: string): Promise<any> => {
	return request.get(`/system/role/${id}`);
};

export const getRoleMenuTreeselect = (id: string): Promise<any> => {
	return request.get(`/system/menu/roleMenuTreeselect/${id}`);
};

export const create = (data: SysRole): Promise<any> => {
	return request.post("/system/role", data);
};

export const update = (data: SysRole): Promise<any> => {
	return request.put("/system/role", data);
};

export const updatePermissions = (
	id: string,
	data: RolePermissionPayload,
): Promise<any> => {
	return update({ roleId: Number(id), menuIds: data.menuIds });
};

export const remove = (id: string): Promise<any> => {
	return request.delete(`/system/role/${id}`);
};
