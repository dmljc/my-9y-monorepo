import { useDroppable } from "@dnd-kit/core";
import type Konva from "konva";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
	Group,
	Image as KonvaImage,
	Layer,
	Stage,
	Transformer,
} from "react-konva";
import { EMPTY_SHAPES } from "../core/constants";
import type { ImageItem, ViewportGeometry } from "../core/types";
import { useAnnotationStore } from "../editor/AnnotationStoreContext";
import ShapeNode from "./ShapeNode";
import { useHtmlImage } from "./useHtmlImage";
import { ViewportProvider } from "./ViewportContext";

interface AnnotationCanvasProps {
	image: ImageItem;
	onViewportChange?: (viewport: ViewportGeometry) => void;
}

export default function AnnotationCanvas({
	image,
	onViewportChange,
}: AnnotationCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<Konva.Stage>(null);
	const transformerRef = useRef<Konva.Transformer>(null);
	const layerRef = useRef<Konva.Layer>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	const currentImageId = useAnnotationStore((s) => s.currentImageId);
	const shapes = useAnnotationStore(
		(s) => s.shapesByImage[currentImageId] ?? EMPTY_SHAPES,
	);
	const selectedShapeId = useAnnotationStore((s) => s.selectedShapeId);
	const selectShape = useAnnotationStore((s) => s.selectShape);

	const htmlImage = useHtmlImage(image.src);

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			setSize({ width: el.clientWidth, height: el.clientHeight });
		});
		ro.observe(el);
		setSize({ width: el.clientWidth, height: el.clientHeight });
		return () => ro.disconnect();
	}, []);

	const imgW = htmlImage?.naturalWidth ?? 0;
	const imgH = htmlImage?.naturalHeight ?? 0;
	const pad = 16;
	const scale =
		imgW && imgH && size.width && size.height
			? Math.min(
					(size.width - pad * 2) / imgW,
					(size.height - pad * 2) / imgH,
				)
			: 1;
	const drawW = imgW * scale;
	const drawH = imgH * scale;
	const offsetX = (size.width - drawW) / 2;
	const offsetY = (size.height - drawH) / 2;

	const viewport = useMemo<ViewportGeometry>(
		() => ({
			containerRect:
				containerRef.current?.getBoundingClientRect() ?? null,
			offsetX,
			offsetY,
			scale,
			imageWidth: imgW,
			imageHeight: imgH,
		}),
		[offsetX, offsetY, scale, imgW, imgH, size.width, size.height],
	);

	useEffect(() => {
		onViewportChange?.({
			...viewport,
			containerRect:
				containerRef.current?.getBoundingClientRect() ?? null,
		});
	}, [viewport, onViewportChange]);

	useEffect(() => {
		const tr = transformerRef.current;
		const layer = layerRef.current;
		if (!tr || !layer) return;
		const selected = shapes.find((s) => s.id === selectedShapeId);
		if (selected?.type === "rect" && selectedShapeId) {
			const node = layer.findOne(`.shape-${selectedShapeId}`);
			tr.nodes(node ? [node] : []);
		} else {
			tr.nodes([]);
		}
		tr.getLayer()?.batchDraw();
	}, [selectedShapeId, shapes]);

	const { setNodeRef } = useDroppable({ id: "annotation-canvas" });

	return (
		<ViewportProvider value={viewport}>
			<div
				className="ia-canvas-wrap"
				ref={(node) => {
					containerRef.current = node;
					setNodeRef(node);
				}}
			>
				<Stage
					ref={stageRef}
					width={size.width}
					height={size.height}
					onMouseDown={(e) => {
						if (e.target === e.target.getStage()) selectShape(null);
					}}
				>
					<Layer ref={layerRef}>
						<Group
							x={offsetX}
							y={offsetY}
							scaleX={scale}
							scaleY={scale}
						>
							{htmlImage && (
								<KonvaImage
									image={htmlImage}
									width={imgW}
									height={imgH}
								/>
							)}
							{shapes.map((shape) => (
								<ShapeNode
									key={shape.id}
									shape={shape}
									scale={scale}
									selected={shape.id === selectedShapeId}
									onSelect={() => selectShape(shape.id)}
								/>
							))}
						</Group>
						<Transformer
							ref={transformerRef}
							rotateEnabled={false}
							ignoreStroke
							boundBoxFunc={(oldBox, newBox) => {
								if (newBox.width < 10 || newBox.height < 10)
									return oldBox;
								const {
									offsetX: ox,
									offsetY: oy,
									scale: sc,
									imageWidth,
									imageHeight,
								} = viewport;
								if (!sc || !imageWidth || !imageHeight)
									return newBox;
								const left = ox;
								const top = oy;
								const right = ox + imageWidth * sc;
								const bottom = oy + imageHeight * sc;
								if (
									newBox.x < left - 0.5 ||
									newBox.y < top - 0.5 ||
									newBox.x + newBox.width > right + 0.5 ||
									newBox.y + newBox.height > bottom + 0.5
								) {
									return oldBox;
								}
								return newBox;
							}}
						/>
					</Layer>
				</Stage>
				{!htmlImage && (
					<div className="ia-canvas-loading">图片加载中…</div>
				)}
			</div>
		</ViewportProvider>
	);
}
