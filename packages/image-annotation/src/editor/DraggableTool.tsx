import { useDraggable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import type { DragPayload } from "../core/types";

interface Props {
	id: string;
	payload: DragPayload;
	className?: string;
	children: ReactNode;
}

export default function DraggableTool({
	id,
	payload,
	className,
	children,
}: Props) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id,
		data: payload,
	});
	return (
		<div
			ref={setNodeRef}
			className={className}
			style={{
				opacity: isDragging ? 0.4 : 1,
				cursor: "grab",
				touchAction: "none",
			}}
			{...listeners}
			{...attributes}
		>
			{children}
		</div>
	);
}
