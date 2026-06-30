// import { request } from "@/services/request";

/** 任务数据类型 */
export interface TaskItem {
	id: string;
	title: string;
	time: string;
	area: string;
	device: string;
	taskTimeStart: string;
	taskTimeEnd: string;
	status: "pending" | "done";
}

/** 任务列表查询参数 */
export interface TaskListParams {
	pageNum: number;
	pageSize: number;
	startTime?: string;
	endTime?: string;
}

/** 任务列表返回结果 */
export interface TaskListResult {
	list: TaskItem[];
	total: number;
	totalDone: number;
	totalPending: number;
	pageNum: number;
	pageSize: number;
}

/** 新增/编辑任务参数 */
export interface TaskCreateParams {
	title: string;
	area: string;
	device: string;
	taskTimeStart: string;
	taskTimeEnd: string;
}

/** 获取任务列表（分页） */
export function list(params: TaskListParams): Promise<TaskListResult> {
	// return request.get("/api/task/list", { params });
	return Promise.resolve({
		list: [],
		total: 0,
		totalDone: 0,
		totalPending: 0,
		pageNum: params.pageNum,
		pageSize: params.pageSize,
	});
}

/** 新增任务 */
export function create(data: TaskCreateParams): Promise<TaskItem> {
	// return request.post("/api/task", data);
	return Promise.resolve({
		id: String(Date.now()),
		title: data.title,
		time: new Date().toISOString(),
		area: data.area,
		device: data.device,
		taskTimeStart: data.taskTimeStart,
		taskTimeEnd: data.taskTimeEnd,
		status: "pending" as const,
	});
}

/** 编辑任务 */
export function update(
	id: string,
	data: Partial<TaskCreateParams>,
): Promise<TaskItem> {
	// return request.put(`/api/task/${id}`, data);
	return Promise.resolve({
		id,
		title: data.title ?? "",
		time: new Date().toISOString(),
		area: data.area ?? "",
		device: data.device ?? "",
		taskTimeStart: data.taskTimeStart ?? "",
		taskTimeEnd: data.taskTimeEnd ?? "",
		status: "pending" as const,
	});
}

/** 切换任务状态（完成 / 撤销完成） */
export function toggleStatus(
	id: string,
	status: "pending" | "done",
): Promise<TaskItem> {
	// return request.put(`/api/task/${id}/status`, { status });
	return Promise.resolve({
		id,
		title: "",
		time: new Date().toISOString(),
		area: "",
		device: "",
		taskTimeStart: "",
		taskTimeEnd: "",
		status,
	});
}

/** 删除任务 */
export function remove(_id: string): Promise<boolean> {
	// return request.delete(`/api/task/${id}`);
	return Promise.resolve(true);
}
