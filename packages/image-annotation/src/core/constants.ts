import type { AnnotationShape } from "./types";

/** 稳定的空数组引用，避免 selector 每次返回新数组导致无限渲染 */
export const EMPTY_SHAPES: AnnotationShape[] = [];
