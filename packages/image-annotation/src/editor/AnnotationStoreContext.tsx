import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
} from "react";
import { useStore } from "zustand";
import {
	type AnnotationEditorState,
	type AnnotationStore,
	type AnnotationStoreState,
	createAnnotationStore,
} from "../core/createStore";
import type { AnnotationsByImage, LabelDef } from "../core/types";

interface AnnotationStoreProviderProps {
	images: { id: string }[];
	value: AnnotationsByImage;
	onChange: (value: AnnotationsByImage) => void;
	currentImageId?: string;
	onCurrentImageChange?: (imageId: string) => void;
	labels: LabelDef[];
	onLabelsChange?: (labels: LabelDef[]) => void;
	onShapeChange?: (action: import("../core/types").ShapeAction) => void;
	onShapeSelect?: (shapeId: string | null, imageId: string) => void;
	children: ReactNode;
}

const AnnotationStoreContext = createContext<AnnotationStore | null>(null);

export function AnnotationStoreProvider({
	images,
	value,
	onChange,
	currentImageId: controlledImageId,
	onCurrentImageChange,
	labels,
	onLabelsChange,
	onShapeChange,
	onShapeSelect,
	children,
}: AnnotationStoreProviderProps) {
	const defaultImageId = images[0]?.id ?? "";
	const storeRef = useRef<AnnotationStore | null>(null);

	if (!storeRef.current) {
		storeRef.current = createAnnotationStore({
			initial: {
				currentImageId: controlledImageId ?? defaultImageId,
				shapesByImage: value,
				selectedShapeId: null,
				labels,
			},
			onAnnotationsChange: onChange,
			onLabelsChange,
			onShapeChange,
			onShapeSelect,
		});
	}

	const store = storeRef.current;

	useEffect(() => {
		const state = store.getState();
		const partial: Partial<AnnotationEditorState> = {};
		let changed = false;

		if (state.shapesByImage !== value) {
			partial.shapesByImage = value;
			changed = true;
		}
		if (
			controlledImageId !== undefined &&
			state.currentImageId !== controlledImageId
		) {
			partial.currentImageId = controlledImageId;
			changed = true;
		}
		if (onLabelsChange && state.labels !== labels) {
			partial.labels = labels;
			changed = true;
		}

		if (changed) {
			store.getState().setExternalState(partial);
		}
	}, [value, labels, controlledImageId, store, onLabelsChange]);

	const prevImageIdRef = useRef(store.getState().currentImageId);
	useEffect(() => {
		const unsub = store.subscribe((state, prev) => {
			if (
				state.currentImageId !== prev.currentImageId &&
				state.currentImageId !== prevImageIdRef.current
			) {
				prevImageIdRef.current = state.currentImageId;
				onCurrentImageChange?.(state.currentImageId);
			}
		});
		return unsub;
	}, [store, onCurrentImageChange]);

	return (
		<AnnotationStoreContext.Provider value={store}>
			{children}
		</AnnotationStoreContext.Provider>
	);
}

export function useAnnotationStore<T>(
	selector: (state: AnnotationStoreState) => T,
): T {
	const store = useContext(AnnotationStoreContext);
	if (!store) {
		throw new Error(
			"useAnnotationStore must be used within AnnotationStoreProvider",
		);
	}
	return useStore(store, selector);
}

export function useAnnotationStoreApi(): AnnotationStore {
	const store = useContext(AnnotationStoreContext);
	if (!store) {
		throw new Error(
			"useAnnotationStoreApi must be used within AnnotationStoreProvider",
		);
	}
	return store;
}
