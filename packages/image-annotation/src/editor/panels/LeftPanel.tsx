import { useEffect, useRef, useState } from "react";
import type { ShapeType } from "../../core/types";
import { useAnnotationStore } from "../AnnotationStoreContext";
import DraggableTool from "../DraggableTool";

interface LeftPanelProps {
	tools: ShapeType[];
}

export default function LeftPanel({ tools }: LeftPanelProps) {
	const labels = useAnnotationStore((s) => s.labels);
	const addLabel = useAnnotationStore((s) => s.addLabel);
	const updateLabel = useAnnotationStore((s) => s.updateLabel);
	const removeLabel = useAnnotationStore((s) => s.removeLabel);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editingId) inputRef.current?.focus();
	}, [editingId]);

	const startEdit = (id: string, name: string) => {
		setEditingId(id);
		setDraft(name);
	};
	const commitEdit = () => {
		if (editingId && draft.trim()) updateLabel(editingId, draft.trim());
		setEditingId(null);
		setDraft("");
	};

	const showRect = tools.includes("rect");
	const showPolygon = tools.includes("polygon");

	return (
		<aside className="ia-left-panel">
			<section className="ia-panel-block">
				<h3 className="ia-panel-title">新建标注框</h3>
				<div className="ia-tool-row">
					{showRect && (
						<DraggableTool
							id="tool-rect"
							payload={{ kind: "shape", shapeType: "rect" }}
							className="ia-tool-card"
						>
							<div className="ia-tool-icon ia-tool-icon-rect" />
							<span>矩形</span>
						</DraggableTool>
					)}
					{showPolygon && (
						<DraggableTool
							id="tool-polygon"
							payload={{ kind: "shape", shapeType: "polygon" }}
							className="ia-tool-card"
						>
							<div className="ia-tool-icon ia-tool-icon-hexagon" />
							<span>六边形</span>
						</DraggableTool>
					)}
				</div>
			</section>

			<section className="ia-panel-block">
				<div className="ia-panel-title-row">
					<h3 className="ia-panel-title">标签管理</h3>
					<button
						type="button"
						className="ia-link-btn"
						onClick={() => addLabel("新标签")}
					>
						新增标签
					</button>
				</div>
				<ul className="ia-label-list">
					{labels.map((lb) => (
						<li key={lb.id} className="ia-label-item">
							{editingId === lb.id ? (
								<input
									className="ia-label-input"
									ref={inputRef}
									value={draft}
									onChange={(e) => setDraft(e.target.value)}
									onBlur={commitEdit}
									onKeyDown={(e) =>
										e.key === "Enter" && commitEdit()
									}
								/>
							) : (
								<DraggableTool
									id={`label-${lb.id}`}
									payload={{
										kind: "label",
										labelName: lb.name,
									}}
									className="ia-label-name"
								>
									{lb.name}
								</DraggableTool>
							)}
							<div className="ia-label-actions">
								<button
									type="button"
									className="ia-icon-btn"
									title="编辑"
									onClick={() => startEdit(lb.id, lb.name)}
								>
									✎
								</button>
								<button
									type="button"
									className="ia-icon-btn"
									title="删除"
									onClick={() => removeLabel(lb.id)}
								>
									🗑
								</button>
							</div>
						</li>
					))}
				</ul>
				<p className="ia-panel-hint">
					提示：拖拽矩形/六边形到画布生成标注；拖拽标签到对应标注框上完成命名。
				</p>
			</section>
		</aside>
	);
}
