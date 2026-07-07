/**
 * 顶部统计卡片展示数据。
 */
export interface StatCard {
	key: "total" | "expiringSoon" | "overdue";
	title: string;
	value: number;
	image: string;
	background: string;
	tone: "blue" | "purple" | "orange";
	valueColor?: string;
}

/**
 * 统计卡片静态资源。
 */
export interface StatCardAssets {
	totalImg: string;
	expiringImg: string;
	overdueImg: string;
	blueCircleBg: string;
	purpleCircleBg: string;
	orangeCircleBg: string;
}
