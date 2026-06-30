import { EMPTY_SHAPES } from "../../core/constants";
import type { AnnotationsByImage } from "../../core/types";
import { useAnnotationStore } from "../AnnotationStoreContext";

interface RightPanelProps {
	onSave?: (value: AnnotationsByImage) => void | Promise<void>;
	onSubmit?: (value: AnnotationsByImage) => void | Promise<void>;
}

export default function RightPanel({ onSave, onSubmit }: RightPanelProps) {
	const shapes = useAnnotationStore(
		(s) => s.shapesByImage[s.currentImageId] ?? EMPTY_SHAPES,
	);
	const selectedShapeId = useAnnotationStore((s) => s.selectedShapeId);
	const selectShape = useAnnotationStore((s) => s.selectShape);
	const removeShape = useAnnotationStore((s) => s.removeShape);
	const shapesByImage = useAnnotationStore((s) => s.shapesByImage);

	const handleSave = () => {
		void onSave?.(shapesByImage);
	};
	const handleSubmit = () => {
		void onSubmit?.(shapesByImage);
	};

	return (
		<aside className="ia-right-panel">
			{(onSave || onSubmit) && (
				<div className="ia-right-actions">
					{onSave && (
						<button
							type="button"
							className="ia-btn ia-btn-default"
							onClick={handleSave}
						>
							保存
						</button>
					)}
					{onSubmit && (
						<button
							type="button"
							className="ia-btn ia-btn-primary"
							onClick={handleSubmit}
						>
							提交
						</button>
					)}
				</div>
			)}

			<h3 className="ia-panel-title">选框列表</h3>
			<table className="ia-anno-table">
				<thead>
					<tr>
						<th style={{ width: 56 }}>序号</th>
						<th>标签名称</th>
						<th style={{ width: 64 }}>操作</th>
					</tr>
				</thead>
				<tbody>
					{shapes.length === 0 ? (
						<tr>
							<td colSpan={3} className="ia-empty-cell">
								暂无标注
							</td>
						</tr>
					) : (
						shapes.map((s) => (
							<tr
								key={s.id}
								className={
									s.id === selectedShapeId
										? "ia-row-selected"
										: ""
								}
								onClick={() => selectShape(s.id)}
							>
								<td>{s.index}</td>
								<td>
									{s.label ?? (
										<span className="ia-muted">未命名</span>
									)}
								</td>
								<td>
									<button
										type="button"
										className="ia-icon-btn"
										title="删除"
										onClick={(e) => {
											e.stopPropagation();
											removeShape(s.id);
										}}
									>
										🗑
									</button>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</aside>
	);
}
