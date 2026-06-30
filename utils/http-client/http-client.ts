/**
 * 基于 axios 的 HTTP 客户端工厂。
 *
 * 约定：
 * - 请求：自动注入 token、语言头
 * - 响应：解包 { code, data, message }，成功返回 data，失败 reject Error
 * - 401：触发 onUnauthorized，便于应用层处理登出
 */
import axios, { type AxiosError } from "axios";
import type {
	ApiResponse,
	HttpClient,
	HttpClientOptions,
} from "./http-client.types";

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_LANG_HEADER = "x-custom-lang";
const DEFAULT_SUCCESS_CODE = 200;

/** 判断响应体是否符合 ApiResponse 结构 */
function isApiResponse(value: unknown): value is ApiResponse {
	return (
		typeof value === "object" &&
		value !== null &&
		"code" in value &&
		"data" in value &&
		"message" in value
	);
}

/** 从 HTTP 错误或业务响应中提取可读错误信息 */
function getErrorMessage(error: AxiosError<ApiResponse>): string {
	const data = error.response?.data;
	if (isApiResponse(data) && data.message) {
		return data.message;
	}
	return error.message || "网络异常，请稍后重试";
}

/**
 * 创建 HTTP 客户端实例。
 *
 * @example
 * ```ts
 * const request = createHttpClient({
 *   baseURL: "/api",
 *   getToken: () => localStorage.getItem("token"),
 *   onUnauthorized: () => location.href = "/login",
 * });
 * const users = await request.get<User[]>("/user/list");
 * ```
 */
export function createHttpClient(options: HttpClientOptions): HttpClient {
	const {
		baseURL,
		timeout = DEFAULT_TIMEOUT,
		getToken,
		getLang,
		langHeaderName = DEFAULT_LANG_HEADER,
		onUnauthorized,
		onError,
		successCode = DEFAULT_SUCCESS_CODE,
		unwrapResponse = true,
		axiosConfig,
	} = options;

	const raw = axios.create({
		baseURL,
		timeout,
		...axiosConfig,
	});

	// 请求拦截：注入鉴权与语言头
	raw.interceptors.request.use((config) => {
		const token = getToken?.();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		const lang = getLang?.();
		if (lang) {
			config.headers[langHeaderName] = lang;
		}

		return config;
	});

	// 响应拦截：解包业务数据 / 统一错误
	raw.interceptors.response.use(
		(response) => {
			if (!unwrapResponse) {
				return response;
			}

			const body = response.data;
			// 非标准结构（如第三方接口）原样返回
			if (!isApiResponse(body)) {
				return body;
			}

			if (body.code === successCode) {
				return body.data;
			}

			// 业务失败：code 非成功值
			const err = new Error(body.message || "请求失败");
			onError?.(err);
			return Promise.reject(err);
		},
		(error: AxiosError<ApiResponse>) => {
			const isUnauthorized = error.response?.status === 401;
			if (isUnauthorized) {
				onUnauthorized?.();
			}

			const err = new Error(getErrorMessage(error));
			if (!isUnauthorized) {
				onError?.(err);
			}
			return Promise.reject(err);
		},
	);

	const client = raw as HttpClient;
	client.raw = raw;
	return client;
}

export type { ApiResponse, HttpClient, HttpClientOptions };
