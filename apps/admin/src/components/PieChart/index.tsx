import type { EChartsOption, LegendComponentOption } from "echarts";
import { PieChart as PieChartSeries } from "echarts/charts";
import { LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useMemo } from "react";
import { useEchartsInit } from "../hooks/useEchartsInit";
import styles from "./PieChart.module.css";

echarts.use([
	PieChartSeries,
	LegendComponent,
	TooltipComponent,
	CanvasRenderer,
]);

export interface PieChartItem {
	name: string;
	value: number;
	/** 自定义扇区颜色，不传则使用默认色板 */
	color?: string;
}

export interface PieChartProps {
	data: PieChartItem[];
	/** 是否在扇区内显示百分比，默认 true */
	showInnerLabel?: boolean;
	/** ECharts legend 配置，会与默认图例样式合并 */
	legend?: LegendComponentOption;
}

const DEFAULT_COLORS = [
	"#52c41a",
	"#fadb14",
	"#b37feb",
	"#13c2c2",
	"#f759ab",
	"#1890ff",
];

function getLegendNameWidth(data: PieChartItem[]): number {
	const maxChars = Math.max(...data.map((item) => item.name.length), 2);
	return maxChars * 13 + 4;
}

function buildDefaultLegend(data: PieChartItem[]): LegendComponentOption {
	const nameWidth = getLegendNameWidth(data);

	return {
		orient: "vertical",
		right: 0,
		top: "center",
		icon: "circle",
		itemWidth: 8,
		itemHeight: 8,
		itemGap: 16,
		data: data.map((item) => item.name),
		textStyle: {
			color: "#4e5969",
			fontSize: 13,
			rich: {
				name: {
					width: nameWidth,
					color: "#4e5969",
					fontSize: 13,
					lineHeight: 20,
				},
				value: {
					width: 24,
					align: "right",
					color: "#1d2129",
					fontSize: 13,
					fontWeight: 500,
					lineHeight: 20,
				},
			},
		},
		formatter: (name) => {
			const item = data.find((entry) => entry.name === name);
			return `{name|${name}}{value|${item?.value ?? 0}}`;
		},
	};
}

const PieChart = ({ data, showInnerLabel = true, legend }: PieChartProps) => {
	const colors = useMemo(
		() =>
			data.map(
				(item, index) =>
					item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
			),
		[data],
	);

	const mergedLegend = useMemo(
		() => ({
			...buildDefaultLegend(data),
			...legend,
		}),
		[data, legend],
	);

	const pieCenter = useMemo<[string, string]>(
		() => (mergedLegend.show === false ? ["50%", "50%"] : ["38%", "50%"]),
		[mergedLegend.show],
	);

	const option = useMemo<EChartsOption>(
		() => ({
			// v6 默认让 rich 继承普通 label 样式；关闭以保持图例 name/value 独立样式
			richInheritPlainLabel: false,
			color: colors,
			tooltip: {
				trigger: "item",
				formatter: "{b}: {c} ({d}%)",
			},
			legend: mergedLegend,
			series: [
				{
					type: "pie",
					radius: ["74%", "78%"],
					center: pieCenter,
					silent: true,
					label: { show: false },
					labelLine: { show: false },
					itemStyle: {
						color: "rgba(24, 144, 255, 0.12)",
						borderWidth: 0,
					},
					data: [{ value: 1 }],
					z: 0,
				},
				{
					type: "pie",
					radius: ["82%", "86%"],
					center: pieCenter,
					silent: true,
					label: { show: false },
					labelLine: { show: false },
					itemStyle: {
						color: "rgba(24, 144, 255, 0.06)",
						borderWidth: 0,
					},
					data: [{ value: 1 }],
					z: 0,
				},
				{
					type: "pie",
					radius: ["0%", "68%"],
					center: pieCenter,
					avoidLabelOverlap: false,
					minShowLabelAngle: 10,
					label: {
						show: showInnerLabel,
						position: "inside",
						formatter: (params) => {
							const percent = Number(params.percent);
							if (percent < 6) return "";
							return `${Math.round(percent)}%`;
						},
						color: "#fff",
						fontSize: 13,
						fontWeight: 500,
					},
					labelLine: { show: false },
					itemStyle: {
						borderColor: "#fff",
						borderWidth: 2,
						shadowBlur: 10,
						shadowColor: "rgba(24, 144, 255, 0.15)",
					},
					emphasis: {
						scale: true,
						scaleSize: 4,
						itemStyle: {
							shadowBlur: 14,
							shadowColor: "rgba(24, 144, 255, 0.25)",
						},
					},
					data: data.map((item, index) => ({
						name: item.name,
						value: item.value,
						itemStyle: {
							color: item.color ?? colors[index],
						},
					})),
					z: 1,
				},
			],
		}),
		[data, colors, showInnerLabel, mergedLegend, pieCenter],
	);

	const chartRef = useEchartsInit(option);

	return <div ref={chartRef} className={styles.container} />;
};

export default PieChart;
