import type { ImageItem, LabelDef } from "../core/types";

/** 演示用图片列表 */
export const DEMO_IMAGES: ImageItem[] = [
	{
		id: "img-0009",
		name: "0009.jpg",
		src: "https://picsum.photos/seed/engine9/1280/800",
	},
	{
		id: "img-0010",
		name: "0010.jpg",
		src: "https://picsum.photos/seed/engine10/1280/800",
	},
	{
		id: "img-0011",
		name: "0011.jpg",
		src: "https://picsum.photos/seed/engine11/1280/800",
	},
];

export const DEMO_LABELS: LabelDef[] = [
	{ id: "lb-1", name: "冷凝罐" },
	{ id: "lb-2", name: "离合器片" },
	{ id: "lb-3", name: "大力鼓" },
	{ id: "lb-4", name: "水箱" },
	{ id: "lb-5", name: "涡轮" },
	{ id: "lb-6", name: "气门盖" },
];
