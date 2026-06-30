import type { AnnotationShape, ViewportGeometry } from "./types";

/** 屏幕坐标 → 图片坐标系。返回 null 表示落点不在图片范围内。 */
export function screenToImage(
	clientX: number,
	clientY: number,
	viewport: ViewportGeometry,
): { x: number; y: number } | null {
	const { containerRect, offsetX, offsetY, scale, imageWidth, imageHeight } =
		viewport;
	if (!containerRect || scale <= 0) return null;
	const localX = clientX - containerRect.left - offsetX;
	const localY = clientY - containerRect.top - offsetY;
	const imgX = localX / scale;
	const imgY = localY / scale;
	if (imgX < 0 || imgY < 0 || imgX > imageWidth || imgY > imageHeight) {
		return null;
	}
	return { x: imgX, y: imgY };
}

/** 命中检测：找出包含该图片坐标点的最上层（最后绘制）形状。 */
export function hitTestShape(
	imgX: number,
	imgY: number,
	shapes: AnnotationShape[],
): AnnotationShape | null {
	for (let i = shapes.length - 1; i >= 0; i--) {
		const s = shapes[i];
		if (s.type === "rect") {
			if (
				imgX >= s.x &&
				imgX <= s.x + s.width &&
				imgY >= s.y &&
				imgY <= s.y + s.height
			) {
				return s;
			}
		} else if (s.type === "polygon" && s.points) {
			if (pointInPolygon(imgX, imgY, s.points)) return s;
		}
	}
	return null;
}

function pointInPolygon(x: number, y: number, pts: number[]): boolean {
	let inside = false;
	const n = pts.length / 2;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const xi = pts[i * 2];
		const yi = pts[i * 2 + 1];
		const xj = pts[j * 2];
		const yj = pts[j * 2 + 1];
		const intersect =
			yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}
