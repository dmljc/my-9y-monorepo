/** 厂房 Tab 展示顺序（X12 优先于 X03）。 */
const BUILDING_TAB_ORDER = ["X12", "X03"];

/**
 * 按业务约定顺序排列厂房 Tab，保证 X12 在最左侧。
 *
 * @param tabs - 厂房 Tab 列表。
 * @returns 排序后的 Tab 列表。
 */
export const sortBuildingTabs = <T extends { label: string }>(tabs: T[]): T[] =>
	[...tabs].sort((a, b) => {
		const orderA = BUILDING_TAB_ORDER.indexOf(a.label);
		const orderB = BUILDING_TAB_ORDER.indexOf(b.label);
		const rankA = orderA === -1 ? BUILDING_TAB_ORDER.length : orderA;
		const rankB = orderB === -1 ? BUILDING_TAB_ORDER.length : orderB;
		if (rankA !== rankB) return rankA - rankB;
		return a.label.localeCompare(b.label);
	});
