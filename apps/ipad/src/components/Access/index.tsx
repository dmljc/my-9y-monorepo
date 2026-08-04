import type { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";

interface AccessProps {
	code: string | string[];
	mode?: "some" | "every";
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * 按钮级权限控制容器：当前用户无权限时不渲染 children（或渲染 fallback）。
 */
const Access = ({ code, mode, children, fallback = null }: AccessProps) => {
	const allowed = usePermission(code, mode);
	return allowed ? children : fallback;
};

export default Access;
