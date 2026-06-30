import type Konva from "konva";
import { useMemo } from "react";
import { Group, Line, Rect, Text } from "react-konva";
import {
	absoluteToRelative,
	getShapeBounds,
	patchFromPolygonPoints,
	relativeToAbsolute,
} from "../core/geometry";
import type { AnnotationShape } from "../core/types";
import { useAnnotationStore } from "../editor/AnnotationStoreContext";
import { useViewport } from "./ViewportContext";

const clamp = (v: number, min: number, max: number) =>
	Math.min(Math.max(v, min), Math.max(min, max));

/** 与 Konva Transformer 锚点一致的方块尺寸（屏幕约 8px） */
const ANCHOR_SCREEN_PX = 8;

interface ShapeNodeProps {
	shape: AnnotationShape;
	scale: number;
	selected: boolean;
	onSelect: () => void;
}

export default function ShapeNode({
	shape,
	scale,
	selected,
	onSelect,
}: ShapeNodeProps) {
	const updateShape = useAnnotationStore((s) => s.updateShape);
	const viewport = useViewport();
	const inv = 1 / scale;
	const stroke = selected ? "#1677ff" : "#ff2d2d";
	const strokeWidth = 2 * inv;
	const fontSize = 15 * inv;

	const bounds = useMemo(() => getShapeBounds(shape), [shape]);
	const relativePoints = useMemo(() => {
		if (shape.type !== "polygon" || !shape.points?.length) return null;
		return absoluteToRelative(shape.points, bounds.x, bounds.y);
	}, [shape.points, shape.type, bounds.x, bounds.y]);

	const dragBoundFunc = (pos: { x: number; y: number }) => {
		const {
			offsetX,
			offsetY,
			scale: sc,
			imageWidth,
			imageHeight,
		} = viewport;
		if (!sc || !imageWidth || !imageHeight) return pos;
		const imgLeft = offsetX;
		const imgTop = offsetY;
		const imgRight = offsetX + imageWidth * sc;
		const imgBottom = offsetY + imageHeight * sc;
		const wAbs = bounds.width * sc;
		const hAbs = bounds.height * sc;
		return {
			x: clamp(pos.x, imgLeft, imgRight - wAbs),
			y: clamp(pos.y, imgTop, imgBottom - hAbs),
		};
	};

	const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
		const node = e.target;
		const nx = node.x();
		const ny = node.y();
		if (shape.type === "rect") {
			updateShape(shape.id, { x: nx, y: ny });
			return;
		}
		if (relativePoints) {
			const newPoints = relativeToAbsolute(relativePoints, nx, ny);
			updateShape(shape.id, patchFromPolygonPoints(newPoints));
		}
	};

	const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
		const node = e.target;
		const sx = node.scaleX();
		const sy = node.scaleY();
		const nx = node.x();
		const ny = node.y();
		node.scaleX(1);
		node.scaleY(1);
		updateShape(shape.id, {
			x: nx,
			y: ny,
			width: Math.max(10, bounds.width * sx),
			height: Math.max(10, bounds.height * sy),
		});
	};

	const anchorSize = ANCHOR_SCREEN_PX * inv;
	const relPts = relativePoints ?? [];

	const handleVertexDragMove = (
		vertexIndex: number,
		e: Konva.KonvaEventObject<DragEvent>,
	) => {
		const node = e.target as Konva.Rect;
		const group = node.getParent();
		if (!group) return;

		const originX = group.x();
		const originY = group.y();
		let relCx = node.x() + anchorSize / 2;
		let relCy = node.y() + anchorSize / 2;

		let absX = originX + relCx;
		let absY = originY + relCy;
		const { imageWidth, imageHeight } = viewport;
		absX = clamp(absX, 0, imageWidth || absX);
		absY = clamp(absY, 0, imageHeight || absY);
		relCx = absX - originX;
		relCy = absY - originY;
		node.position({ x: relCx - anchorSize / 2, y: relCy - anchorSize / 2 });

		const next = [...(shape.points ?? [])];
		next[vertexIndex * 2] = absX;
		next[vertexIndex * 2 + 1] = absY;
		updateShape(shape.id, patchFromPolygonPoints(next));
	};

	const showVertexAnchors =
		shape.type === "polygon" && selected && relPts.length >= 12;

	return (
		<Group
			name={`shape-${shape.id}`}
			x={bounds.x}
			y={bounds.y}
			draggable
			dragBoundFunc={dragBoundFunc}
			onClick={onSelect}
			onTap={onSelect}
			onDragEnd={handleDragEnd}
			onTransformEnd={
				shape.type === "rect" ? handleTransformEnd : undefined
			}
		>
			{shape.type === "rect" ? (
				<Rect
					x={0}
					y={0}
					width={bounds.width}
					height={bounds.height}
					stroke={stroke}
					strokeWidth={strokeWidth}
					strokeScaleEnabled={false}
					fill="rgba(255,45,45,0.06)"
				/>
			) : (
				<Line
					points={relPts}
					closed
					stroke={stroke}
					strokeWidth={strokeWidth}
					strokeScaleEnabled={false}
					fill="rgba(255,45,45,0.06)"
				/>
			)}
			<Text
				x={4 * inv}
				y={4 * inv}
				text={String(shape.index)}
				fontSize={fontSize}
				fontStyle="bold"
				fill="#ff2d2d"
			/>
			{shape.label && (
				<Text
					x={4 * inv}
					y={4 * inv + fontSize + 2 * inv}
					text={shape.label}
					fontSize={fontSize}
					fill="#1677ff"
				/>
			)}
			{showVertexAnchors &&
				Array.from({ length: relPts.length / 2 }).map((_, i) => (
					<Rect
						key={`anchor-${shape.id}-${i}`}
						x={relPts[i * 2] - anchorSize / 2}
						y={relPts[i * 2 + 1] - anchorSize / 2}
						width={anchorSize}
						height={anchorSize}
						fill="#ffffff"
						stroke="#1677ff"
						strokeWidth={1 * inv}
						strokeScaleEnabled={false}
						draggable
						onMouseDown={(e) => {
							e.cancelBubble = true;
						}}
						onDragMove={(e) => handleVertexDragMove(i, e)}
						onDragEnd={(e) => handleVertexDragMove(i, e)}
					/>
				))}
		</Group>
	);
}
