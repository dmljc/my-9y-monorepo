import { useState } from "react";
import type { AnnotationsByImage } from "../core/types";
import ImageAnnotationEditor from "../editor/ImageAnnotationEditor";
import { DEMO_IMAGES, DEMO_LABELS } from "./demoData";

export default function DemoApp() {
	const [annotations, setAnnotations] = useState<AnnotationsByImage>({});
	const [labels, setLabels] = useState(DEMO_LABELS);
	const [currentImageId, setCurrentImageId] = useState(DEMO_IMAGES[0].id);

	const currentImage = DEMO_IMAGES.find((i) => i.id === currentImageId);

	return (
		<ImageAnnotationEditor
			images={DEMO_IMAGES}
			value={annotations}
			onChange={setAnnotations}
			currentImageId={currentImageId}
			onCurrentImageChange={setCurrentImageId}
			labels={labels}
			onLabelsChange={setLabels}
			header={{
				title: currentImage?.name,
				onBack: () => alert("返回"),
				extra: "演示用户 已登录",
			}}
			onSave={(data) => {
				localStorage.setItem("annotations", JSON.stringify(data));
				alert("已保存到 localStorage");
			}}
			onSubmit={(data) => {
				console.log("提交数据：", data);
				alert("提交成功（数据已打印到控制台）");
			}}
		/>
	);
}
