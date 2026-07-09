/** Excel 文件 MIME 类型。 */
export const XLSX_MIME =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * 解析导出接口返回的 Blob，识别 JSON 错误响应，转换为可下载文件 Blob。
 *
 * @param {Blob} - 导出接口返回的原始 Blob。
 * @param {string} - 解析失败/无异常时使用的目标文件 MIME 类型。
 * @returns {Promise<Blob>} - 可直接下载的文件 Blob。
 */
export async function resolveExportBlob(
	data: Blob,
	mimeType: string,
): Promise<Blob> {
	if (!data.type.includes("json") && !data.type.includes("text")) {
		return data;
	}

	const text = await data.text();
	try {
		const result = JSON.parse(text) as {
			code?: number;
			msg?: string;
			message?: string;
		};
		if (result.code !== undefined && result.code !== 200) {
			throw new Error(result.msg ?? result.message ?? "导出失败");
		}
	} catch (error) {
		if (error instanceof SyntaxError) {
			return new Blob([text], { type: mimeType });
		}
		throw error;
	}

	return new Blob([text], { type: mimeType });
}

/**
 * 触发浏览器下载 Blob 文件。
 *
 * @param {Blob} - 文件内容。
 * @param {string} - 下载文件名。
 * @returns {void} - 无返回值。
 */
export function downloadBlob(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
