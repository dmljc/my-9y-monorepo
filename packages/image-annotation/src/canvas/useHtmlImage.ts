import { useEffect, useState } from "react";

/** 加载 HTMLImageElement 的小 hook */
export function useHtmlImage(src: string) {
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	useEffect(() => {
		setImage(null);
		const img = new window.Image();
		img.crossOrigin = "anonymous";
		img.src = src;
		const onLoad = () => setImage(img);
		img.addEventListener("load", onLoad);
		return () => img.removeEventListener("load", onLoad);
	}, [src]);
	return image;
}
