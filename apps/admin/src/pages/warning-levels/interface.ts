/**
 * 报警等级列表查询参数。
 */
export interface LevelListQuery {
	pageNum: number;
	pageSize: number;
}

/**
 * 后端报警等级实体。
 */
export interface IiotAlarmLevel {
	id?: number;
	levelName?: string;
	color?: string;
	sortOrder?: number;
}
