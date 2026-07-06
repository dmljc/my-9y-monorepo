/**
 * 基于 axios 的 HTTP 客户端工厂。
 *
 * 约定：
 * - 请求：自动注入 token、语言头
 * - 响应：解包 { code, data, message | msg }，成功返回 data，失败 reject Error
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

/** 标准 envelope 除 code/data 外允许的元字段 */
const ENVELOPE_META_KEYS = new Set(["code", "data", "message", "msg"]);

/** 判断是否为带 code 的业务响应体（兼容 code 为数字或数字字符串） */
function getBusinessCode(body: Record<string, unknown>): number | null {
	const raw = body.code;
	if (typeof raw === "number") return raw;
	if (typeof raw === "string" && raw.trim() !== "") {
		const parsed = Number(raw);
		return Number.isNaN(parsed) ? null : parsed;
	}
	return null;
}

function isBusinessEnvelope(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null || !("code" in value)) {
		return false;
	}
	return getBusinessCode(value) !== null;
}

/** 是否为仅含 code/message(msg) 的成功响应（如 { code: 200 }） */
function isCodeOnlySuccessEnvelope(body: Record<string, unknown>): boolean {
	if ("data" in body) return false;
	return Object.keys(body).every((key) =>
		["code", "message", "msg"].includes(key),
	);
}

/** 是否为仅含 code/data/message(msg) 的标准 envelope，可安全解包 data */
function isStandardDataEnvelope(body: Record<string, unknown>): boolean {
	if (!("data" in body)) return false;
	return Object.keys(body).every((key) => ENVELOPE_META_KEYS.has(key));
}

/** 读取业务提示文案，兼容 message 与 msg */
function getBusinessMessage(body: Record<string, unknown>): string {
	const message = body.message ?? body.msg;
	return typeof message === "string" ? message : "";
}

/** 从 HTTP 错误或业务响应中提取可读错误信息 */
function getErrorMessage(error: AxiosError<ApiResponse>): string {
	const data = error.response?.data;
	if (isBusinessEnvelope(data)) {
		const message = getBusinessMessage(data);
		if (message) return message;
	}
	return error.message || "网络异常，请稍后重试";
}

/**
 * 处理业务响应体：成功时解包 data 或原样返回；失败时 reject。
 *
 * HTTP 状态为 2xx 但响应体不是约定的 `{ code, data }` envelope 时
 * （如反向代理/隧道异常返回的 HTML 页面），同样视为失败并 reject，
 * 避免调用方拿到非预期结构（如 HTML 字符串）却误判为成功。
 */
function unwrapBusinessBody(
	body: unknown,
	successCode: number,
	onError?: (error: Error) => void,
): unknown {
	if (!isBusinessEnvelope(body)) {
		const err = new Error("服务响应异常，请稍后重试");
		onError?.(err);
		throw err;
	}

	const code = getBusinessCode(body);
	if (code === successCode) {
		if (isStandardDataEnvelope(body)) {
			return body.data;
		}
		if (isCodeOnlySuccessEnvelope(body)) {
			return undefined;
		}
		return body;
	}

	const err = new Error(getBusinessMessage(body) || "请求失败");
	onError?.(err);
	throw err;
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
 * const users = await request.get("/user/list");
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

			return unwrapBusinessBody(
				response.data,
				successCode,
				onError,
			) as typeof response.data;
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
