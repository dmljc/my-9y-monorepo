import type { ReactNode } from "react";

export type ShapeType = "rect" | "polygon";

/** 一个标注框/多边形。坐标统一存储在「图片原始坐标系」下（不随画布缩放变化） */
export interface AnnotationShape {
	id: string;
	imageId: string;
	type: ShapeType;
	index: number;
	label?: string;
	/** rect 使用 x/y/width/height */
	x: number;
	y: number;
	width: number;
	height: number;
	/** polygon（正六边形等）使用 points: [x1,y1,x2,y2,...]（图片坐标系） */
	points?: number[];
}

export interface ImageItem {
	id: string;
	name: string;
	src: string;
}

/** 标签定义（左侧标签管理） */
export interface LabelDef {
	id: string;
	name: string;
}

/** 每张图片各自的标注数据 */
export type AnnotationsByImage = Record<string, AnnotationShape[]>;

/** 左侧可拖拽控件携带的数据 */
export type DragPayload =
	| { kind: "shape"; shapeType: ShapeType }
	| { kind: "label"; labelName: string };

/** 画布视口几何（图片坐标 ↔ 屏幕坐标换算） */
export interface ViewportGeometry {
	containerRect: DOMRect | null;
	offsetX: number;
	offsetY: number;
	scale: number;
	imageWidth: number;
	imageHeight: number;
}

export const EMPTY_VIEWPORT: ViewportGeometry = {
	containerRect: null,
	offsetX: 0,
	offsetY: 0,
	scale: 1,
	imageWidth: 0,
	imageHeight: 0,
};

/** 标注框变更动作 */
export type ShapeAction =
	| { type: "add"; shape: AnnotationShape; imageId: string }
	| { type: "remove"; shape: AnnotationShape; imageId: string }
	| {
			type: "update";
			shape: AnnotationShape;
			prevShape: AnnotationShape;
			imageId: string;
	  };

export interface ImageAnnotationEditorHeader {
	title?: string;
	onBack?: () => void;
	extra?: ReactNode;
}

/** 传 `false` 可隐藏顶栏 */
export type ImageAnnotationEditorHeaderConfig =
	| ImageAnnotationEditorHeader
	| false;

export interface ImageAnnotationEditorProps {
	images: ImageItem[];
	value: AnnotationsByImage;
	onChange: (value: AnnotationsByImage) => void;
	currentImageId?: string;
	onCurrentImageChange?: (imageId: string) => void;
	labels?: LabelDef[];
	onLabelsChange?: (labels: LabelDef[]) => void;
	onSave?: (value: AnnotationsByImage) => void | Promise<void>;
	onSubmit?: (value: AnnotationsByImage) => void | Promise<void>;
	header?: ImageAnnotationEditorHeaderConfig;
	tools?: ShapeType[];
	className?: string;
	/** 标注框变更时触发（新建/删除/拖拽/缩放/改标签） */
	onShapeChange?: (action: ShapeAction) => void;
	/** 选中标注框变化时触发，传 null 表示取消选中 */
	onShapeSelect?: (shapeId: string | null, imageId: string) => void;
}
