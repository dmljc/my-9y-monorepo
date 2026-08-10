/** 平板 WebSocket 断线重连间隔（毫秒）。 */
const RECONNECT_MS = 3000;

/** 平板 WebSocket 消息订阅回调。 */
export type TabletWsListener = (message: string) => void;

/** 当前所有业务页面的消息订阅者。 */
const listeners = new Set<TabletWsListener>();

/** 项目内复用的唯一 WebSocket 实例。 */
let socket: WebSocket | null = null;

/** 待执行的断线重连定时器。 */
let reconnectTimer: number | null = null;

/**
 * 组装平板实时数据 WebSocket 地址（不传 token）。
 *
 * @returns {string} - WebSocket URL。
 */
const getTabletWsUrl = (): string => {
	const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
		/\/$/,
		"",
	);

	if (/^https?:\/\//i.test(apiBase)) {
		const parsed = new URL(`${apiBase}/ws/tablet`);
		parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
		return parsed.toString();
	}

	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}${apiBase}/ws/tablet`;
};

/**
 * 清理待执行的重连任务。
 *
 * @returns {void} - 无返回值。
 */
const clearReconnectTimer = () => {
	if (reconnectTimer === null) return;
	window.clearTimeout(reconnectTimer);
	reconnectTimer = null;
};

/**
 * 向全部订阅者分发 WebSocket 文本消息。
 *
 * @param {string} - 原始消息。
 * @returns {void} - 无返回值。
 */
const notifyListeners = (message: string) => {
	for (const listener of listeners) {
		listener(message);
	}
};

/**
 * 建立平板实时数据连接；已有连接或无订阅者时不重复创建。
 *
 * @returns {void} - 无返回值。
 */
const connect = () => {
	if (
		listeners.size === 0 ||
		socket?.readyState === WebSocket.CONNECTING ||
		socket?.readyState === WebSocket.OPEN
	) {
		return;
	}

	clearReconnectTimer();
	const nextSocket = new WebSocket(getTabletWsUrl());
	socket = nextSocket;

	nextSocket.onmessage = (event) => {
		notifyListeners(String(event.data ?? ""));
	};

	nextSocket.onclose = () => {
		if (socket === nextSocket) socket = null;
		if (listeners.size === 0) return;
		reconnectTimer = window.setTimeout(connect, RECONNECT_MS);
	};
};

/**
 * 订阅项目唯一的平板 WebSocket 连接。
 * 第一个订阅者进入时建立连接；最后一个取消订阅后关闭连接。
 *
 * @param {TabletWsListener} - 消息处理函数。
 * @returns {() => void} - 取消订阅函数。
 */
export const subscribeTabletWs = (listener: TabletWsListener): (() => void) => {
	listeners.add(listener);
	connect();

	return () => {
		listeners.delete(listener);
		if (listeners.size > 0) return;

		clearReconnectTimer();
		const currentSocket = socket;
		socket = null;
		if (!currentSocket) return;
		currentSocket.onmessage = null;
		currentSocket.onclose = null;
		currentSocket.close();
	};
};
