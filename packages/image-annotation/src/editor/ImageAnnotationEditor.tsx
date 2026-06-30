import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useCallback, useEffect, useRef, useState } from "react";
import AnnotationCanvas from "../canvas/AnnotationCanvas";
import { EMPTY_SHAPES } from "../core/constants";
import type {
	DragPayload,
	ImageAnnotationEditorHeaderConfig,
	ImageAnnotationEditorProps,
	ShapeType,
	ViewportGeometry,
} from "../core/types";
import { hitTestShape, screenToImage } from "../core/viewport";
import {
	AnnotationStoreProvider,
	useAnnotationStore,
} from "./AnnotationStoreContext";
import ImageStrip from "./panels/ImageStrip";
import LeftPanel from "./panels/LeftPanel";
import RightPanel from "./panels/RightPanel";

const DEFAULT_TOOLS: ShapeType[] = ["rect", "polygon"];

function EditorContent({
	images,
	header,
	tools,
	onSave,
	onSubmit,
}: Pick<ImageAnnotationEditorProps, "images" | "onSave" | "onSubmit"> & {
	header: ImageAnnotationEditorHeaderConfig;
	tools: ShapeType[];
}) {
	const currentImageId = useAnnotationStore((s) => s.currentImageId);
	const addShape = useAnnotationStore((s) => s.addShape);
	const assignLabel = useAnnotationStore((s) => s.assignLabel);
	const shapes = useAnnotationStore(
		(s) => s.shapesByImage[s.currentImageId] ?? EMPTY_SHAPES,
	);

	const currentImage = images.find((i) => i.id === currentImageId);
	const viewportRef = useRef<ViewportGeometry>({
		containerRect: null,
		offsetX: 0,
		offsetY: 0,
		scale: 1,
		imageWidth: 0,
		imageHeight: 0,
	});

	const [activePayload, setActivePayload] = useState<DragPayload | null>(
		null,
	);
	const pointer = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const onMove = (e: PointerEvent) => {
			pointer.current = { x: e.clientX, y: e.clientY };
		};
		window.addEventListener("pointermove", onMove);
		return () => window.removeEventListener("pointermove", onMove);
	}, []);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
	);

	const handleViewportChange = useCallback((viewport: ViewportGeometry) => {
		viewportRef.current = viewport;
	}, []);

	const handleDragStart = (e: DragStartEvent) => {
		setActivePayload((e.active.data.current as DragPayload) ?? null);
	};

	const handleDragEnd = (_e: DragEndEvent) => {
		setActivePayload(null);
		const payload = _e.active.data.current as DragPayload | undefined;
		if (!payload || !currentImage) return;

		const pt = screenToImage(
			pointer.current.x,
			pointer.current.y,
			viewportRef.current,
		);
		if (!pt) return;

		if (payload.kind === "shape") {
			addShape(
				currentImageId,
				payload.shapeType,
				pt.x,
				pt.y,
				viewportRef.current,
			);
		} else if (payload.kind === "label") {
			const hit = hitTestShape(pt.x, pt.y, shapes);
			if (hit) assignLabel(hit.id, payload.labelName);
		}
	};

	const title =
		(header !== false && header.title) ?? currentImage?.name ?? "图片标注";

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			{header !== false && (
				<header className="ia-top-bar">
					<span className="ia-top-title">{title}</span>
				</header>
			)}

			<div className="ia-main">
				<LeftPanel tools={tools} />
				{currentImage ? (
					<AnnotationCanvas
						image={currentImage}
						onViewportChange={handleViewportChange}
					/>
				) : (
					<div className="ia-canvas-wrap ia-canvas-empty">
						暂无图片
					</div>
				)}
				<RightPanel onSave={onSave} onSubmit={onSubmit} />
			</div>

			<ImageStrip images={images} />

			<DragOverlay dropAnimation={null}>
				{activePayload ? (
					<div className="ia-drag-overlay">
						{activePayload.kind === "shape"
							? activePayload.shapeType === "rect"
								? "矩形"
								: "六边形"
							: activePayload.labelName}
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

export default function ImageAnnotationEditor({
	images,
	value,
	onChange,
	currentImageId,
	onCurrentImageChange,
	labels = [],
	onLabelsChange,
	onSave,
	onSubmit,
	header = {},
	tools = DEFAULT_TOOLS,
	className,
	onShapeChange,
	onShapeSelect,
}: ImageAnnotationEditorProps) {
	if (images.length === 0) {
		return (
			<div className={`ia-editor ${className ?? ""}`.trim()}>
				<div className="ia-canvas-empty">请传入至少一张图片</div>
			</div>
		);
	}

	return (
		<div className={`ia-editor ${className ?? ""}`.trim()}>
			<AnnotationStoreProvider
				images={images}
				value={value}
				onChange={onChange}
				currentImageId={currentImageId}
				onCurrentImageChange={onCurrentImageChange}
				labels={labels}
				onLabelsChange={onLabelsChange}
				onShapeChange={onShapeChange}
				onShapeSelect={onShapeSelect}
			>
				<EditorContent
					images={images}
					header={header}
					tools={tools ?? DEFAULT_TOOLS}
					onSave={onSave}
					onSubmit={onSubmit}
				/>
			</AnnotationStoreProvider>
		</div>
	);
}
