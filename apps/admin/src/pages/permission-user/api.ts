import type { User, UserFormValues, UserListFilters } from "./utils";
import {
	buildRoleNames,
	generateMockUsers,
	getOrganizationName,
} from "./utils";

/** mock 内存存储，对接后端后移除 */
const usersStore: User[] = generateMockUsers();

function findIndex(id: string): number {
	return usersStore.findIndex((item) => item.id === id);
}

/** 按筛选条件过滤用户（mock 本地筛选，后端接入后由服务端处理） */
function filterUsers(filters: UserListFilters): User[] {
	const { username = "", name = "" } = filters;
	return usersStore.filter((item) => {
		const matchUsername = username
			? item.username.includes(username)
			: true;
		const matchName = name ? item.name.includes(name) : true;
		return matchUsername && matchName;
	});
}

/** 将表单值转为用户实体字段（不含 id、createdAt） */
function toUserRecord(values: UserFormValues): Omit<User, "id" | "createdAt"> {
	return {
		username: values.username.trim(),
		name: values.name.trim(),
		organizationId: values.organizationId,
		organizationName: getOrganizationName(values.organizationId),
		roleIds: values.roleIds,
		roleNames: buildRoleNames(values.roleIds),
	};
}

export interface UserListParams extends UserListFilters {
	pageNum: number;
	pageSize: number;
}

export interface UserListResult {
	list: User[];
	total: number;
	pageNum: number;
	pageSize: number;
}

/** 获取用户列表（分页） */
export function list(params: UserListParams): Promise<UserListResult> {
	// return request.get("/api/permission/user", { params });
	const { pageNum, pageSize, ...filters } = params;
	const filtered = filterUsers(filters);
	const start = (pageNum - 1) * pageSize;
	return Promise.resolve({
		list: filtered.slice(start, start + pageSize),
		total: filtered.length,
		pageNum,
		pageSize,
	});
}

/** 创建用户 */
export function create(values: UserFormValues): Promise<User> {
	// return request.post("/api/permission/user", values);
	const record: User = {
		id: `user-${Date.now()}`,
		...toUserRecord(values),
		createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
	};
	usersStore.unshift(record);
	return Promise.resolve(record);
}

/** 更新用户（password 仅提交后端，不落库到 mock 列表） */
export function update(
	id: string,
	values: Partial<UserFormValues>,
): Promise<User> {
	// return request.put(`/api/permission/user/${id}`, values);
	const index = findIndex(id);
	if (index === -1) return Promise.reject(new Error("用户不存在"));

	const nextValues = { ...values };
	delete nextValues.password;

	const patch: Partial<User> = {};
	if (nextValues.username !== undefined) {
		patch.username = nextValues.username.trim();
	}
	if (nextValues.name !== undefined) {
		patch.name = nextValues.name.trim();
	}
	if (nextValues.organizationId !== undefined) {
		patch.organizationId = nextValues.organizationId;
		patch.organizationName = getOrganizationName(nextValues.organizationId);
	}
	if (nextValues.roleIds !== undefined) {
		patch.roleIds = nextValues.roleIds;
		patch.roleNames = buildRoleNames(nextValues.roleIds);
	}

	usersStore[index] = { ...usersStore[index], ...patch };
	return Promise.resolve(usersStore[index]);
}

/** 删除用户 */
export function remove(id: string): Promise<void> {
	// return request.delete(`/api/permission/user/${id}`);
	const index = findIndex(id);
	if (index === -1) return Promise.reject(new Error("用户不存在"));
	usersStore.splice(index, 1);
	return Promise.resolve();
}

/** 获取全部用户（供表单唯一性校验等使用） */
export function getAllUsers(): User[] {
	return [...usersStore];
}

/** 按筛选条件获取待导出数据 */
export function exportUsers(filters: UserListFilters = {}): User[] {
	return filterUsers(filters);
}
