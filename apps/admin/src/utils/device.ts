import type { TableProps } from "antd";

/** Table scroll 配置。 */
type TableScroll = TableProps["scroll"];

/**
 * 是否为平板设备（含 iPad、iPadOS 桌面 UA、常见 Android 平板）。
 *
 * @returns {boolean} - 平板为 true，电脑为 false。
 */
export function isTabletDevice(): boolean {
	if (typeof navigator === "undefined") return false;

	const ua = navigator.userAgent;
	if (/iPad|Tablet/i.test(ua)) return true;
	if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return true;

	// iPadOS 13+ Safari 可能伪装成 Macintosh，需结合触控点数判断
	if (
		/Macintosh/i.test(ua) &&
		typeof navigator.maxTouchPoints === "number" &&
		navigator.maxTouchPoints > 1
	) {
		return true;
	}

	return false;
}

/**
 * 组装 Table scroll：平板端横向按内容撑开，电脑端保持原配置以免改变桌面布局。
 *
 * @param {TableScroll} - 电脑端已有的 scroll，可不传。
 * @returns {TableScroll} - 平板返回含 x: max-content 的配置；电脑返回原配置。
 */
export function getTableScroll(desktopScroll?: TableScroll): TableScroll {
	if (isTabletDevice()) {
		return { ...desktopScroll, x: "max-content" };
	}
	return desktopScroll;
}
