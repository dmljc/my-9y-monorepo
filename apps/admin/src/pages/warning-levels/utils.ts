import mockData from "./mockData.json";

/** 报警等级 */
export interface WarningLevel {
	id: string;
	name: string;
	color: string;
}

/** 新增 / 编辑表单值 */
export interface LevelFormValues {
	name: string;
	color: string;
}

export const MOCK_LEVELS: WarningLevel[] = mockData as WarningLevel[];
