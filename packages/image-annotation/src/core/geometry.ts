import type { AnnotationShape } from "./types";

/** 生成以 (cx, cy) 为中心、顶点朝上的正六边形顶点（图片坐标系） */
export function createRegularHexagonPoints(
	cx: number,
	cy: number,
	radius = 70,
): number[] {
	const points: number[] = [];
	for (let i = 0; i < 6; i++) {
		const angle = -Math.PI / 2 + (i * Math.PI) / 3;
		points.push(
			Math.round(cx + radius * Math.cos(angle)),
			Math.round(cy + radius * Math.sin(angle)),
		);
	}
	return points;
}

/** 由绝对顶点坐标同步外接矩形与 points */
export function patchFromPolygonPoints(points: number[]) {
	const xs = points.filter((_, i) => i % 2 === 0);
	const ys = points.filter((_, i) => i % 2 === 1);
	const minX = Math.min(...xs);
	const minY = Math.min(...ys);
	return {
		x: minX,
		y: minY,
		width: Math.max(10, Math.max(...xs) - minX),
		height: Math.max(10, Math.max(...ys) - minY),
		points,
	};
}

/** 将多边形整体平移，使其完全落在图片范围内 */
export function clampPolygonPointsToImage(
	points: number[],
	imageWidth: number,
	imageHeight: number,
): number[] {
	const { x, y, width, height } = patchFromPolygonPoints(points);
	let dx = 0;
	let dy = 0;
	if (x < 0) dx = -x;
	if (y < 0) dy = -y;
	if (x + width > imageWidth) dx = imageWidth - (x + width);
	if (y + height > imageHeight) dy = imageHeight - (y + height);
	if (dx === 0 && dy === 0) return points;
	return points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy));
}

/** 统一外接矩形（Group 锚点 + 边界约束） */
export function getShapeBounds(shape: AnnotationShape) {
	if (shape.type === "rect") {
		return {
			x: shape.x,
			y: shape.y,
			width: shape.width,
			height: shape.height,
		};
	}
	const pts = shape.points ?? [];
	if (pts.length < 12) {
		return {
			x: shape.x,
			y: shape.y,
			width: shape.width,
			height: shape.height,
		};
	}
	const { x, y, width, height } = patchFromPolygonPoints(pts);
	return { x, y, width, height };
}

export function absoluteToRelative(
	points: number[],
	originX: number,
	originY: number,
) {
	return points.map((p, i) => (i % 2 === 0 ? p - originX : p - originY));
}

export function relativeToAbsolute(
	points: number[],
	originX: number,
	originY: number,
) {
	return points.map((p, i) => (i % 2 === 0 ? p + originX : p + originY));
}
