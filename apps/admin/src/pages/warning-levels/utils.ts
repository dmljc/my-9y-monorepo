/** 报警等级 */
export interface WarningLevel {
	id: string;
	name: string;
	color: string;
	sortOrder?: number;
}

/** 新增 / 编辑表单值 */
export interface LevelFormValues {
	name: string;
	color: string;
}
