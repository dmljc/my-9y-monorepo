import { useUserStore } from "@/stores/user";
import { hasPermission } from "@/utils/permission";

/**
 * 响应式获取按钮权限判断结果，权限数据变化（登录、刷新用户信息）时组件自动重渲染。
 *
 * @param {string | string[]} - 单个权限码，或权限码数组。
 * @param {"some" | "every"} - 数组时的匹配模式：命中任一项或需全部命中，默认 "some"。
 * @returns {boolean} - 是否拥有权限。
 */
export function usePermission(
	code: string | string[],
	mode: "some" | "every" = "some",
): boolean {
	// 订阅 permissions 引用以保证权限刷新后组件重渲染
	useUserStore((state) => state.permissions);
	return hasPermission(code, mode);
}
