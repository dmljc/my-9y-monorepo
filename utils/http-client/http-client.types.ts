import type { AxiosInstance, AxiosRequestConfig } from "axios";

/**
 * 后端统一响应结构（约定：code === successCode 表示成功）
 */
export interface ApiResponse<T = unknown> {
	/** 业务状态码，200 表示成功 */
	code: number;
	/** 实际业务数据 */
	data: T;
	/** 提示信息，失败时用于展示或 reject */
	message: string;
}

/** createHttpClient 配置项 */
export interface HttpClientOptions {
	/** API 根路径，如 /api 或 https://api.example.com */
	baseURL: string;
	/** 请求超时（毫秒），默认 30000 */
	timeout?: number;
	/** 读取 access token，有值时自动附加 Authorization 头 */
	getToken?: () => string | null;
	/** 语言标识，有值时写入语言请求头 */
	getLang?: () => string | null;
	/** 语言请求头名称，默认 x-custom-lang */
	langHeaderName?: string;
	/** HTTP 401 时回调（如清除登录态、跳转登录页） */
	onUnauthorized?: () => void;
	/** 请求失败时全局回调（401 除外，避免与 onUnauthorized 重复提示） */
	onError?: (error: Error) => void;
	/** 业务成功 code，与 ApiResponse.code 比对，默认 200 */
	successCode?: number;
	/**
	 * 是否解包 ApiResponse 并直接返回 data，默认 true。
	 * 设为 false 时返回完整 AxiosResponse。
	 */
	unwrapResponse?: boolean;
	/** 合并到 axios.create 的额外配置 */
	axiosConfig?: AxiosRequestConfig;
}

/**
 * 封装后的 HTTP 客户端。
 * 拦截器会解包业务响应，因此 get/post 等方法直接得到 data 类型。
 * 返回值为 `any`：拦截器在运行时解包了 ApiResponse，静态无法感知具体类型。
 * 类型安全由各 api 函数的显式返回值标注保证。
 */
export interface HttpClient extends AxiosInstance {
	/** 原始 axios 实例，不走业务解包（如下载 blob、读取响应头） */
	raw: AxiosInstance;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get(url: string, config?: AxiosRequestConfig): Promise<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	post(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	put(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	delete(url: string, config?: AxiosRequestConfig): Promise<any>;
}
