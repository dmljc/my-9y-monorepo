import type { User, UserFormValues } from "./utils";
import { generateMockUsers } from "./utils";

// mock 内存存储
const usersStore: User[] = generateMockUsers();

function findIndex(id: string): number {
	return usersStore.findIndex((item) => item.id === id);
}

export interface UserListParams {
	pageNum: number;
	pageSize: number;
	username?: string;
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
	const { pageNum, pageSize, username = "" } = params;
	let filtered = usersStore;
	if (username) {
		filtered = filtered.filter((item) => item.username.includes(username));
	}
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
		...values,
		createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
	};
	usersStore.unshift(record);
	return Promise.resolve(record);
}

/** 更新用户 */
export function update(
	id: string,
	values: Partial<UserFormValues>,
): Promise<User> {
	// return request.put(`/api/permission/user/${id}`, values);
	const index = findIndex(id);
	if (index === -1) return Promise.reject(new Error("用户不存在"));
	usersStore[index] = { ...usersStore[index], ...values };
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

/** 获取全部用户 */
export function getAllUsers(): User[] {
	return [...usersStore];
}
