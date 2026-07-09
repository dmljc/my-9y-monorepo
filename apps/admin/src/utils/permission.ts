import { useUserStore } from "@/stores/user";

/** 超级管理员通配权限码，后端 getInfo 返回，命中时放行所有按钮权限。 */
const SUPER_ADMIN_PERM = "*:*:*";

/**
 * 判断当前用户是否拥有指定按钮权限，供非组件场景（事件回调、modal.confirm 等）直接调用。
 *
 * @param {string | string[]} - 单个权限码，或权限码数组。
 * @param {"some" | "every"} - 数组时的匹配模式：命中任一项或需全部命中，默认 "some"。
 * @returns {boolean} - 是否拥有权限。
 */
export function hasPermission(
	code: string | string[],
	mode: "some" | "every" = "some",
): boolean {
	const permissions = useUserStore.getState().permissions;
	if (permissions.includes(SUPER_ADMIN_PERM)) return true;

	const codes = Array.isArray(code) ? code : [code];
	return mode === "every"
		? codes.every((item) => permissions.includes(item))
		: codes.some((item) => permissions.includes(item));
}
