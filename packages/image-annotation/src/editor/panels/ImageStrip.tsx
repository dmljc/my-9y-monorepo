import type { ImageItem } from "../../core/types";
import { useAnnotationStore } from "../AnnotationStoreContext";

interface ImageStripProps {
	images: ImageItem[];
}

export default function ImageStrip({ images }: ImageStripProps) {
	const currentImageId = useAnnotationStore((s) => s.currentImageId);
	const setCurrentImage = useAnnotationStore((s) => s.setCurrentImage);

	const currentIndex = images.findIndex((i) => i.id === currentImageId);
	const go = (delta: number) => {
		if (images.length === 0) return;
		const next = (currentIndex + delta + images.length) % images.length;
		setCurrentImage(images[next].id);
	};

	if (images.length === 0) return null;

	return (
		<footer className="ia-image-strip">
			<button
				type="button"
				className="ia-nav-btn"
				onClick={() => go(-1)}
				aria-label="上一张"
			>
				‹
			</button>
			<div className="ia-thumbs">
				{images.map((img) => (
					<button
						type="button"
						key={img.id}
						className={`ia-thumb ${img.id === currentImageId ? "ia-thumb-active" : ""}`}
						onClick={() => setCurrentImage(img.id)}
						title={img.name}
					>
						<img src={img.src} alt={img.name} />
					</button>
				))}
			</div>
			<button
				type="button"
				className="ia-nav-btn"
				onClick={() => go(1)}
				aria-label="下一张"
			>
				›
			</button>
		</footer>
	);
}
