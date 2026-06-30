import { createStore as createZustandStore, type StoreApi } from "zustand";
import {
	clampPolygonPointsToImage,
	createRegularHexagonPoints,
	patchFromPolygonPoints,
} from "./geometry";
import type {
	AnnotationShape,
	AnnotationsByImage,
	LabelDef,
	ShapeAction,
	ShapeType,
	ViewportGeometry,
} from "./types";

let seq = 0;
const uid = (prefix: string) =>
	`${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;
const clamp = (v: number, min: number, max: number) =>
	Math.min(Math.max(v, min), max);

export interface AnnotationEditorState {
	currentImageId: string;
	shapesByImage: AnnotationsByImage;
	selectedShapeId: string | null;
	labels: LabelDef[];
}

export interface AnnotationStoreActions {
	setExternalState: (partial: Partial<AnnotationEditorState>) => void;
	setCurrentImage: (imageId: string) => void;
	selectShape: (id: string | null) => void;
	addShape: (
		imageId: string,
		type: ShapeType,
		x: number,
		y: number,
		viewport?: Pick<ViewportGeometry, "imageWidth" | "imageHeight">,
	) => string;
	updateShape: (id: string, patch: Partial<AnnotationShape>) => void;
	removeShape: (id: string) => void;
	assignLabel: (shapeId: string, labelName: string) => void;
	addLabel: (name: string) => void;
	updateLabel: (id: string, name: string) => void;
	removeLabel: (id: string) => void;
}

export type AnnotationStoreState = AnnotationEditorState &
	AnnotationStoreActions;
export type AnnotationStore = StoreApi<AnnotationStoreState>;

export interface CreateAnnotationStoreOptions {
	initial: AnnotationEditorState;
	onAnnotationsChange?: (shapesByImage: AnnotationsByImage) => void;
	onLabelsChange?: (labels: LabelDef[]) => void;
	onShapeChange?: (action: ShapeAction) => void;
	onShapeSelect?: (shapeId: string | null, imageId: string) => void;
}

const findImageOfShape = (
	shapesByImage: AnnotationsByImage,
	shapeId: string,
): string | undefined =>
	Object.keys(shapesByImage).find((imgId) =>
		shapesByImage[imgId].some((s) => s.id === shapeId),
	);

const findShapeById = (
	shapesByImage: AnnotationsByImage,
	shapeId: string,
): AnnotationShape | undefined => {
	for (const imgId of Object.keys(shapesByImage)) {
		const found = shapesByImage[imgId].find((s) => s.id === shapeId);
		if (found) return found;
	}
	return undefined;
};

export function createAnnotationStore(
	options: CreateAnnotationStoreOptions,
): AnnotationStore {
	const {
		initial,
		onAnnotationsChange,
		onLabelsChange,
		onShapeChange,
		onShapeSelect,
	} = options;

	return createZustandStore<AnnotationStoreState>((set, get) => ({
		...initial,

		setExternalState: (partial) => set(partial),

		setCurrentImage: (imageId) =>
			set({ currentImageId: imageId, selectedShapeId: null }),

		selectShape: (id) => {
			const state = get();
			const imageId = state.currentImageId;
			onShapeSelect?.(id, imageId);
			set({ selectedShapeId: id });
		},

		addShape: (imageId, type, x, y, viewport) => {
			const id = uid("sp");
			const { imageWidth = 0, imageHeight = 0 } = viewport ?? {};
			set((state) => {
				const list = state.shapesByImage[imageId] ?? [];
				const defaultW = 140;
				const defaultH = 100;
				let nx = Math.round(x - defaultW / 2);
				let ny = Math.round(y - defaultH / 2);
				if (imageWidth && imageHeight) {
					nx = clamp(nx, 0, Math.max(0, imageWidth - defaultW));
					ny = clamp(ny, 0, Math.max(0, imageHeight - defaultH));
				}
				let shape: AnnotationShape;
				if (type === "polygon") {
					let points = createRegularHexagonPoints(x, y);
					if (imageWidth && imageHeight) {
						points = clampPolygonPointsToImage(
							points,
							imageWidth,
							imageHeight,
						);
					}
					const hex = patchFromPolygonPoints(points);
					shape = {
						id,
						imageId,
						type,
						index: list.length + 1,
						x: hex.x,
						y: hex.y,
						width: hex.width,
						height: hex.height,
						points: hex.points,
					};
				} else {
					shape = {
						id,
						imageId,
						type,
						index: list.length + 1,
						x: nx,
						y: ny,
						width: defaultW,
						height: defaultH,
					};
				}
				const shapesByImage = {
					...state.shapesByImage,
					[imageId]: [...list, shape],
				};
				onAnnotationsChange?.(shapesByImage);
				onShapeChange?.({ type: "add", shape, imageId });
				return { shapesByImage, selectedShapeId: id };
			});
			return id;
		},

		updateShape: (id, patch) =>
			set((state) => {
				const imageId = findImageOfShape(state.shapesByImage, id);
				if (!imageId) return state;
				const prevShape = findShapeById(state.shapesByImage, id);
				if (!prevShape) return state;
				const updated = { ...prevShape, ...patch };
				const shapesByImage = {
					...state.shapesByImage,
					[imageId]: state.shapesByImage[imageId].map((s) =>
						s.id === id ? updated : s,
					),
				};
				onAnnotationsChange?.(shapesByImage);
				onShapeChange?.({
					type: "update",
					shape: updated,
					prevShape,
					imageId,
				});
				return { shapesByImage };
			}),

		removeShape: (id) =>
			set((state) => {
				const imageId = findImageOfShape(state.shapesByImage, id);
				if (!imageId) return state;
				const shape = findShapeById(state.shapesByImage, id);
				if (!shape) return state;
				const next = state.shapesByImage[imageId]
					.filter((s) => s.id !== id)
					.map((s, i) => ({ ...s, index: i + 1 }));
				const shapesByImage = {
					...state.shapesByImage,
					[imageId]: next,
				};
				onAnnotationsChange?.(shapesByImage);
				onShapeChange?.({ type: "remove", shape, imageId });
				return {
					shapesByImage,
					selectedShapeId:
						state.selectedShapeId === id
							? null
							: state.selectedShapeId,
				};
			}),

		assignLabel: (shapeId, labelName) =>
			get().updateShape(shapeId, { label: labelName }),

		addLabel: (name) =>
			set((state) => {
				const labels = [...state.labels, { id: uid("lb"), name }];
				onLabelsChange?.(labels);
				return { labels };
			}),

		updateLabel: (id, name) =>
			set((state) => {
				const labels = state.labels.map((l) =>
					l.id === id ? { ...l, name } : l,
				);
				onLabelsChange?.(labels);
				return { labels };
			}),

		removeLabel: (id) =>
			set((state) => {
				const labels = state.labels.filter((l) => l.id !== id);
				onLabelsChange?.(labels);
				return { labels };
			}),
	}));
}
