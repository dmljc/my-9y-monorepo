// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** API 连接状态 → Ant Design Tag 颜色映射 */
export const STATUS_COLOR: Record<string, string> = {
	已连接: "success",
	断开: "error",
	异常: "warning",
};

/** 请求类型下拉选项 */
export const TYPE_OPTIONS = ["GET", "POST", "PUT", "DELETE"].map((v) => ({
	label: v,
	value: v,
}));

/** 连接状态下拉选项 */
export const STATUS_OPTIONS = ["已连接", "断开", "异常"].map((v) => ({
	label: v,
	value: v,
}));
