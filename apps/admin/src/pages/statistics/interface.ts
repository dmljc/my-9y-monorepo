/** 统计分析时间范围查询参数。 */
export interface StatisticsQuery {
	startTime?: string;
	endTime?: string;
}

/** 厂房报警次数统计项。 */
export interface AlarmByBuildingItem {
	building: string;
	count: number;
}

/** 告警等级分布统计项。 */
export interface AlarmByLevelItem {
	levelName: string;
	levelColor?: string;
	count: number;
}

/** 告警趋势单日数据点。 */
export interface AlarmTrendPoint {
	date: string;
	count: number;
}

/** 告警趋势统计响应。 */
export interface AlarmTrendData {
	trend: AlarmTrendPoint[];
	days: number;
}
