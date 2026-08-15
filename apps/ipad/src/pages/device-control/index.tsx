import { App, Button, Empty } from "antd";
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Access from "@/components/Access";
import LineCharts from "@/components/LineChartsByDevice";
import LineChartsByRoom from "@/components/LineChartsByRoom";
import {
	DEVICE_CONTROL_BUILDING_PERMS,
	PERM_DEVICE_CONTROL,
} from "@/constants/permission";
import { usePermission } from "@/hooks/usePermission";
import BuildingPageHeader from "@/layout/BuildingPageHeader";
import { filterBuildingsByPermission, subscribeTabletWs } from "@/utils";
import {
	listBuildings,
	listDeviceTrend,
	listRooms,
	listRoomTrend,
	saveRoomConfig,
	switchBuilding,
	switchDevice,
	toggleClean,
	update,
} from "./api";
import InstanceModal from "./InstanceModal";
import RoomModal from "./RoomModal";
import styles from "./index.module.css";
import type {
	BuildingTab,
	DeviceItem,
	DeviceTrendChartData,
	InstanceFormValues,
	ListMode,
	RoomFormValues,
	RoomTrendSeriesItem,
} from "./interface";
import {
	buildEmptyRoomTrendSeries,
	collectRoomMetrics,
	deriveMasterOn,
	displayDash,
	EMPTY_TREND_CHART,
	findWsDeviceForItem,
	formatMetric,
	getMetricIconKey,
	getTabletWsDevices,
	groupDevicesByRoom,
	indexTabletWsDevices,
	isTabletRealtimeTopic,
	joinDeviceCodes,
	joinDeviceNames,
	LIST_MODE_OPTIONS,
	type MetricIconKey,
	mapRuntimeParams,
	mergeDeviceFromWs,
	mergeRoomTrendSeries,
	mergeTrendChartData,
	normalizeBuildingTabs,
	normalizeDeviceCode,
	parseDevicesFromRooms,
	parseTabletWsMessage,
	previewDeviceCodes,
	TREND_SLIDER_RANGE_MS,
	toRoomTrendSeries,
	toTrendChartData,
} from "./utils";

interface DeviceGlyphProps {
	className?: string;
}

const DeviceGlyph = ({ className }: DeviceGlyphProps) => (
	<svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
		<title>设备</title>
		<rect x="4" y="8" width="32" height="10" rx="2" fill="currentColor" />
		<rect x="4" y="22" width="32" height="10" rx="2" fill="currentColor" />
		<rect x="10" y="12" width="8" height="2" rx="1" fill="#fff" />
		<rect x="10" y="26" width="8" height="2" rx="1" fill="#fff" />
	</svg>
);

interface MetricGlyphProps {
	type: MetricIconKey;
	className?: string;
}

const MetricGlyph = ({ type, className }: MetricGlyphProps) => {
	if (type === "pressure") {
		return (
			<svg
				className={className}
				viewBox="0 0 88 88"
				fill="none"
				aria-hidden
			>
				<title>压力</title>
				<path
					d="M18 58a26 26 0 1 1 52 0"
					stroke="currentColor"
					strokeWidth="6"
					strokeLinecap="round"
				/>
				<circle cx="44" cy="58" r="5" fill="currentColor" />
				<path
					d="M44 58 58 40"
					stroke="#000"
					strokeWidth="5"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	if (type === "concentration") {
		return (
			<svg
				className={className}
				viewBox="0 0 88 88"
				fill="none"
				aria-hidden
			>
				<title>浓度</title>
				<circle cx="30" cy="28" r="7" fill="currentColor" />
				<circle cx="52" cy="24" r="5" fill="#1a1a1a" />
				<circle cx="44" cy="42" r="6" fill="currentColor" />
				<circle cx="28" cy="48" r="4" fill="#1a1a1a" />
				<path
					d="M16 64c10-10 18 10 28 0s18 10 28 0"
					stroke="currentColor"
					strokeWidth="5"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	if (type === "velocity") {
		return (
			<svg
				className={className}
				viewBox="0 0 88 88"
				fill="none"
				aria-hidden
			>
				<title>流速</title>
				<path
					d="M14 28c8-10 16 10 26 0s16 10 26 0"
					stroke="currentColor"
					strokeWidth="6"
					strokeLinecap="round"
				/>
				<path
					d="M14 44c8-10 16 10 26 0s16 10 26 0"
					stroke="#1a1a1a"
					strokeWidth="6"
					strokeLinecap="round"
				/>
				<path
					d="M14 60c8-10 16 10 26 0s16 10 26 0"
					stroke="currentColor"
					strokeWidth="6"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	if (type === "temperature") {
		return (
			<svg
				className={className}
				viewBox="0 0 88 88"
				fill="none"
				aria-hidden
			>
				<title>温度</title>
				<rect
					x="38"
					y="16"
					width="12"
					height="40"
					rx="6"
					stroke="currentColor"
					strokeWidth="5"
				/>
				<circle cx="44" cy="62" r="12" fill="currentColor" />
				<path
					d="M44 36v22"
					stroke="#fff"
					strokeWidth="4"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	return (
		<svg className={className} viewBox="0 0 88 88" fill="none" aria-hidden>
			<title>流量</title>
			<path
				d="M14 48c8-16 14 16 22 0s14 16 22 0 14 16 16 0"
				stroke="currentColor"
				strokeWidth="6"
				strokeLinecap="round"
			/>
		</svg>
	);
};

const DeviceControl = () => {
	const { message } = App.useApp();
	const stageRef = useRef<HTMLDivElement>(null);
	const canList = usePermission(PERM_DEVICE_CONTROL.LIST);
	const canSwitchBuilding = usePermission(
		PERM_DEVICE_CONTROL.SWITCH_BUILDING,
	);
	const [buildings, setBuildings] = useState<BuildingTab[]>([]);
	const [buildingKey, setBuildingKey] = useState("");
	const [devices, setDevices] = useState<DeviceItem[]>([]);
	const [masterOn, setMasterOn] = useState(true);
	const [loading, setLoading] = useState(false);
	const [listMode, setListMode] = useState<ListMode>("device");
	const [instanceOpen, setInstanceOpen] = useState(false);
	const [roomOpen, setRoomOpen] = useState(false);
	const [selectedIdByBuilding, setSelectedIdByBuilding] = useState<
		Record<string, number>
	>({});
	const [selectedRoomKeyByBuilding, setSelectedRoomKeyByBuilding] = useState<
		Record<string, string>
	>({});
	const [trendPropertyId, setTrendPropertyId] = useState("");
	const [trendChart, setTrendChart] =
		useState<DeviceTrendChartData>(EMPTY_TREND_CHART);
	const [roomTrendSeries, setRoomTrendSeries] = useState<
		RoomTrendSeriesItem[]
	>([]);
	const deviceTrendReqRef = useRef(0);
	const deviceTrendFromRef = useRef<number | null>(null);
	const roomTrendReqRef = useRef(0);
	const roomTrendFromRef = useRef<number | null>(null);
	const wsMetricsRef = useRef<{
		byId: Map<number, DeviceItem["metrics"]>;
		byCode: Map<string, DeviceItem["metrics"]>;
		byName: Map<string, DeviceItem["metrics"]>;
	}>({
		byId: new Map(),
		byCode: new Map(),
		byName: new Map(),
	});

	const pickCachedMetrics = (item: DeviceItem) => {
		const cache = wsMetricsRef.current;
		if (cache.byId.has(item.deviceId)) return cache.byId.get(item.deviceId);
		const code = normalizeDeviceCode(item.code);
		if (code && cache.byCode.has(code)) return cache.byCode.get(code);
		const name = normalizeDeviceCode(item.name);
		if (name && cache.byName.has(name)) return cache.byName.get(name);
		return undefined;
	};

	const currentBuilding =
		buildings.find((item) => item.key === buildingKey) ?? null;
	const roomGroups = groupDevicesByRoom(devices);
	const selectedId = selectedIdByBuilding[buildingKey] ?? null;
	const selectedRoomKey =
		selectedRoomKeyByBuilding[buildingKey] ?? roomGroups[0]?.key ?? "";
	const selectedRoom =
		roomGroups.find((item) => item.key === selectedRoomKey) ??
		roomGroups[0] ??
		null;
	const selectedById =
		devices.find((item) => item.deviceId === selectedId) ??
		devices[0] ??
		null;
	const selected =
		listMode === "room"
			? (selectedRoom?.devices.find(
					(item) => item.deviceId === selectedId,
				) ??
				selectedRoom?.devices[0] ??
				null)
			: selectedById;
	const roomMetrics = collectRoomMetrics(selectedRoom?.devices ?? []);
	const metricCards =
		listMode === "room" ? roomMetrics : (selected?.metrics ?? []);

	const applyDevices = (
		buildingKeyNext: string,
		next: DeviceItem[],
		forceEnabled?: boolean,
	) => {
		const devicesNext =
			forceEnabled === undefined
				? next
				: next.map((item) => ({ ...item, enabled: forceEnabled }));
		setDevices((prev) => {
			const metricsById = new Map(
				prev.map((item) => [item.deviceId, item.metrics]),
			);
			return devicesNext.map((item) => ({
				...item,
				metrics:
					pickCachedMetrics(item) ??
					metricsById.get(item.deviceId) ??
					item.metrics,
			}));
		});
		setMasterOn(
			forceEnabled !== undefined
				? forceEnabled
				: deriveMasterOn(devicesNext),
		);
		setSelectedIdByBuilding((prev) => {
			const remembered = prev[buildingKeyNext];
			if (
				remembered &&
				devicesNext.some((item) => item.deviceId === remembered)
			) {
				return prev;
			}
			const fallback = devicesNext[0]?.deviceId;
			if (!fallback) {
				const cleared = { ...prev };
				delete cleared[buildingKeyNext];
				return cleared;
			}
			return { ...prev, [buildingKeyNext]: fallback };
		});
		setSelectedRoomKeyByBuilding((prev) => {
			const groups = groupDevicesByRoom(devicesNext);
			const remembered = prev[buildingKeyNext];
			if (remembered && groups.some((item) => item.key === remembered)) {
				return prev;
			}
			const fallback = groups[0]?.key;
			if (!fallback) {
				const cleared = { ...prev };
				delete cleared[buildingKeyNext];
				return cleared;
			}
			return { ...prev, [buildingKeyNext]: fallback };
		});
	};

	const loadDevices = async (
		buildingId: number,
		buildingKeyNext: string,
		forceEnabled?: boolean,
	) => {
		const data = await listRooms(buildingId);
		applyDevices(
			buildingKeyNext,
			parseDevicesFromRooms(data),
			forceEnabled,
		);
	};

	const loadBuildings = async () => {
		const buildingsData = await listBuildings();
		const tabs = filterBuildingsByPermission(
			normalizeBuildingTabs(buildingsData),
			DEVICE_CONTROL_BUILDING_PERMS,
		);
		setBuildings(tabs);
		if (!tabs.length) {
			setBuildingKey("");
			setDevices([]);
			return;
		}
		const nextKey =
			tabs.some((item) => item.key === buildingKey) && buildingKey
				? buildingKey
				: tabs[0].key;
		setBuildingKey(nextKey);
		const tab = tabs.find((item) => item.key === nextKey);
		if (tab) await loadDevices(tab.buildingId, nextKey);
	};

	useEffect(() => {
		if (!canList) return;
		loadBuildings();
	}, [canList]);

	useEffect(() => {
		const metrics =
			listMode === "room" ? roomMetrics : (selected?.metrics ?? []);
		const firstPropertyId = metrics[0]?.propertyId ?? "";
		if (!firstPropertyId) {
			if (listMode === "device") setTrendPropertyId("");
			return;
		}
		setTrendPropertyId((prev) =>
			metrics.some((item) => item.propertyId === prev)
				? prev
				: firstPropertyId,
		);
	}, [
		listMode,
		selected?.deviceId,
		selected?.metrics[0]?.propertyId,
		selected?.metrics.length,
		roomMetrics[0]?.propertyId,
		roomMetrics.length,
	]);

	useEffect(() => {
		const deviceId = selected?.deviceId ?? 0;
		const propertyId = trendPropertyId;
		if (listMode !== "device" || !deviceId || !propertyId) {
			setTrendChart(EMPTY_TREND_CHART);
			return;
		}
		let cancelled = false;
		const reqId = ++deviceTrendReqRef.current;
		const to = Date.now();
		const from = to - TREND_SLIDER_RANGE_MS;
		deviceTrendFromRef.current = from;
		listDeviceTrend({ deviceId, propertyId, from, to })
			.then((data) => {
				if (cancelled || reqId !== deviceTrendReqRef.current) return;
				setTrendChart(toTrendChartData(data));
			})
			.catch(() => {
				if (!cancelled && reqId === deviceTrendReqRef.current) {
					setTrendChart(EMPTY_TREND_CHART);
				}
			});
		return () => {
			cancelled = true;
			deviceTrendReqRef.current += 1;
		};
	}, [listMode, selected?.deviceId, trendPropertyId]);

	useEffect(() => {
		const buildingId = currentBuilding?.buildingId ?? 0;
		const roomId = selectedRoom?.roomId ?? 0;
		const roomDevices = selectedRoom?.devices ?? [];
		if (listMode !== "room" || !buildingId || !roomId) {
			setRoomTrendSeries([]);
			return;
		}
		const propertyId = trendPropertyId;
		const emptySeries = buildEmptyRoomTrendSeries(roomDevices);
		if (!propertyId) {
			setRoomTrendSeries(emptySeries);
			return;
		}
		setRoomTrendSeries(emptySeries);
		let cancelled = false;
		const reqId = ++roomTrendReqRef.current;
		const to = Date.now();
		const from = to - TREND_SLIDER_RANGE_MS;
		roomTrendFromRef.current = from;
		listRoomTrend({ buildingId, roomId, propertyId, from, to })
			.then((data) => {
				if (cancelled || reqId !== roomTrendReqRef.current) return;
				const series = toRoomTrendSeries(data);
				setRoomTrendSeries(series.length ? series : emptySeries);
			})
			.catch(() => {
				if (!cancelled && reqId === roomTrendReqRef.current) {
					setRoomTrendSeries(emptySeries);
				}
			});
		return () => {
			cancelled = true;
			roomTrendReqRef.current += 1;
		};
	}, [
		listMode,
		currentBuilding?.buildingId,
		selectedRoom?.roomId,
		trendPropertyId,
	]);

	const fetchDeviceTrendRange = (range: { from: number; to: number }) => {
		const deviceId = selected?.deviceId ?? 0;
		const propertyId = trendPropertyId;
		if (
			!deviceId ||
			!propertyId ||
			!Number.isFinite(range.from) ||
			!Number.isFinite(range.to)
		) {
			return;
		}
		const reqId = ++deviceTrendReqRef.current;
		listDeviceTrend({
			deviceId,
			propertyId,
			from: range.from,
			to: range.to,
		})
			.then((data) => {
				if (reqId !== deviceTrendReqRef.current) return;
				const next = toTrendChartData(data);
				if (!next.series.length) return;
				setTrendChart((prev) => mergeTrendChartData(prev, next));
			})
			.catch(() => undefined);
	};

	/** 翻页：沿用当前查询的 from，只更新 to */
	const handleDeviceTrendTimePage = (range: { from: number; to: number }) => {
		const from = deviceTrendFromRef.current ?? range.from;
		fetchDeviceTrendRange({ from, to: range.to });
	};

	/** 滑块松手：同时更新 from / to */
	const handleDeviceTrendRangeChange = (range: {
		from: number;
		to: number;
	}) => {
		deviceTrendFromRef.current = range.from;
		fetchDeviceTrendRange(range);
	};

	const fetchRoomTrendRange = (range: { from: number; to: number }) => {
		const buildingId = currentBuilding?.buildingId ?? 0;
		const roomId = selectedRoom?.roomId ?? 0;
		const propertyId = trendPropertyId;
		if (
			!buildingId ||
			!roomId ||
			!propertyId ||
			!Number.isFinite(range.from) ||
			!Number.isFinite(range.to)
		) {
			return;
		}
		const reqId = ++roomTrendReqRef.current;
		listRoomTrend({
			buildingId,
			roomId,
			propertyId,
			from: range.from,
			to: range.to,
		})
			.then((data) => {
				if (reqId !== roomTrendReqRef.current) return;
				const series = toRoomTrendSeries(data);
				if (!series.length) return;
				setRoomTrendSeries((prev) =>
					mergeRoomTrendSeries(prev, series),
				);
			})
			.catch(() => undefined);
	};

	/** 翻页：沿用当前查询的 from，只更新 to */
	const handleRoomTrendTimePage = (range: { from: number; to: number }) => {
		const from = roomTrendFromRef.current ?? range.from;
		fetchRoomTrendRange({ from, to: range.to });
	};

	/** 滑块松手：同时更新 from / to */
	const handleRoomTrendRangeChange = (range: {
		from: number;
		to: number;
	}) => {
		roomTrendFromRef.current = range.from;
		fetchRoomTrendRange(range);
	};

	useEffect(() => {
		return subscribeTabletWs((raw) => {
			const wsMessage = parseTabletWsMessage(raw);
			const devicesFromWs = getTabletWsDevices(wsMessage);
			if (
				!isTabletRealtimeTopic(
					wsMessage?.topic,
					devicesFromWs.length > 0,
				)
			) {
				return;
			}
			if (!devicesFromWs.length) return;

			const wsIndex = indexTabletWsDevices(devicesFromWs);
			const cache = wsMetricsRef.current;

			for (const row of devicesFromWs) {
				const metrics = mapRuntimeParams(row.runtimeParams);
				const id = Number(row.deviceId ?? 0);
				const code = normalizeDeviceCode(row.deviceCode);
				const name = normalizeDeviceCode(row.deviceName);
				if (id) cache.byId.set(id, metrics);
				if (code) cache.byCode.set(code, metrics);
				if (name) cache.byName.set(name, metrics);
			}

			setDevices((prev) => {
				if (!prev.length) return prev;

				const touchedIds: number[] = [];
				const next = prev.map((item) => {
					const row = findWsDeviceForItem(item, wsIndex);
					if (!row) return item;
					const merged = mergeDeviceFromWs(item, row);
					cache.byId.set(item.deviceId, merged.metrics);
					touchedIds.push(item.deviceId);
					return merged;
				});

				if (!touchedIds.length) return prev;

				setMasterOn(deriveMasterOn(next));
				return next;
			});
		});
	}, []);

	const handleBuildingChange = (key: string) => {
		setBuildingKey(key);
		const tab = buildings.find((item) => item.key === key);
		if (tab) loadDevices(tab.buildingId, key);
	};

	const handleSelectDevice = (deviceId: number) => {
		const device = devices.find((item) => item.deviceId === deviceId);
		setSelectedIdByBuilding((prev) => ({
			...prev,
			[buildingKey]: deviceId,
		}));
		if (!device) return;
		const roomKey = device.roomId
			? String(device.roomId)
			: device.roomLabel;
		setSelectedRoomKeyByBuilding((prev) => ({
			...prev,
			[buildingKey]: roomKey,
		}));
	};

	const handleSelectRoom = (key: string) => {
		const group = roomGroups.find((item) => item.key === key);
		setSelectedRoomKeyByBuilding((prev) => ({
			...prev,
			[buildingKey]: key,
		}));
		const firstId = group?.devices[0]?.deviceId;
		if (!firstId) return;
		setSelectedIdByBuilding((prev) => ({
			...prev,
			[buildingKey]: firstId,
		}));
	};

	const handleMasterChange = async (checked: boolean) => {
		if (!currentBuilding) {
			message.warning("暂无可用厂房");
			return;
		}
		const name = currentBuilding.label;
		setLoading(true);
		try {
			await switchBuilding(
				currentBuilding.buildingId,
				checked ? "on" : "off",
			);
			setMasterOn(checked);
			setDevices((prev) =>
				prev.map((item) => ({ ...item, enabled: checked })),
			);
			message.success(
				checked
					? `“${name}”厂房总开关已开启`
					: `“${name}”厂房总开关已关闭`,
			);
			await loadDevices(currentBuilding.buildingId, buildingKey, checked);
		} finally {
			setLoading(false);
		}
	};

	const handleDeviceSwitch = async (checked: boolean) => {
		if (!selected || !currentBuilding) return;
		setLoading(true);
		try {
			await switchDevice(selected.deviceId, checked ? "on" : "off");
			const nextDevices = devices.map((item) =>
				item.deviceId === selected.deviceId
					? { ...item, enabled: checked }
					: item,
			);
			setDevices(nextDevices);
			setMasterOn(deriveMasterOn(nextDevices));
			message.success(checked ? "设备开关已开启" : "设备开关已关闭");
			await loadDevices(currentBuilding.buildingId, buildingKey);
		} finally {
			setLoading(false);
		}
	};

	const handleClean = async () => {
		if (!selected || !currentBuilding) return;
		const wasCleaning = selected.cleaning;
		setLoading(true);
		try {
			await toggleClean(selected.deviceId);
			await loadDevices(currentBuilding.buildingId, buildingKey);
			message.success(
				wasCleaning ? "已取消设备清洗" : "已下发设备清洗指令",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleInstanceSubmit = async (values: InstanceFormValues) => {
		if (!selected || !currentBuilding) return;
		await update({
			id: selected.id,
			deviceCode: values.deviceCode.trim(),
			deviceName: values.deviceName.trim(),
			manufacturer: values.manufacturer?.trim() ?? "",
			thingIds: values.thingIds ?? [],
		});
		message.success("实例配置成功");
		await loadDevices(currentBuilding.buildingId, buildingKey);
	};

	const handleRoomSubmit = async (values: RoomFormValues) => {
		if (!selected || !currentBuilding) return;
		const roomId = Number(values.roomId);
		const flowRate = Number(values.flowRate);
		const roomGroup = roomGroups.find(
			(item) => String(item.roomId) === String(values.roomId),
		);
		await saveRoomConfig({
			deviceId: selected.deviceId,
			roomId,
			room: values.room ?? roomGroup?.roomLabel,
			flowRate,
		});
		message.success("连接房间成功");
		await loadDevices(currentBuilding.buildingId, buildingKey);
	};

	if (!canList) {
		return <Navigate to="/home" replace />;
	}

	const infoTitle = listMode === "room" ? "房间信息" : "设备信息";
	const infoNameLabel = listMode === "room" ? "房间名称" : "设备名称";
	const infoNameValue =
		listMode === "room"
			? displayDash(selectedRoom?.roomLabel ?? selected?.roomLabel)
			: displayDash(selected?.name);
	const infoCells =
		listMode === "room"
			? [
					[infoNameLabel, infoNameValue],
					[
						"设备名称",
						displayDash(
							joinDeviceNames(selectedRoom?.devices ?? []),
						),
					],
					[
						"设备编码",
						displayDash(
							joinDeviceCodes(selectedRoom?.devices ?? []),
						),
					],
					["管道编号", displayDash(selected?.pipeNo)],
				]
			: [
					[infoNameLabel, infoNameValue],
					["设备编号", displayDash(selected?.code)],
					["管道编号", displayDash(selected?.pipeNo)],
					["监控房间", displayDash(selected?.roomLabel)],
				];

	return (
		<div className={styles.deviceControl} data-page="device-control">
			<div ref={stageRef} className={styles.stage}>
				<BuildingPageHeader
					buildingKey={buildingKey}
					buildings={buildings}
					onBuildingChange={handleBuildingChange}
					masterOn={masterOn}
					onMasterChange={
						canSwitchBuilding
							? (checked) => {
									handleMasterChange(checked);
								}
							: undefined
					}
				/>

				<div className={styles.body}>
					<aside className={styles.sidebar}>
						<div className={styles.segment} role="tablist">
							{LIST_MODE_OPTIONS.map((item) => (
								<button
									key={item.key}
									type="button"
									role="tab"
									aria-selected={listMode === item.key}
									className={`${styles.segmentItem} ${
										listMode === item.key
											? styles.segmentItemActive
											: ""
									}`}
									onClick={() => setListMode(item.key)}
								>
									{item.label}
								</button>
							))}
						</div>

						{devices.length === 0 ? (
							<div className={styles.emptyWrap}>
								<Empty />
							</div>
						) : (
							<div className={styles.list}>
								{listMode === "device"
									? devices.map((device) => {
											const active =
												selected?.deviceId ===
												device.deviceId;
											const metaActive = device.enabled;
											return (
												<button
													key={device.deviceId}
													type="button"
													className={`${styles.listItem} ${active ? styles.listItemActive : ""}`}
													onClick={() => {
														handleSelectDevice(
															device.deviceId,
														);
													}}
												>
													<div
														className={
															styles.listItemTop
														}
													>
														<DeviceGlyph
															className={
																styles.listIcon
															}
														/>
														<span
															className={
																styles.listTitle
															}
														>
															{device.name}
														</span>
														<span
															className={`${styles.statusTag} ${
																device.enabled
																	? styles.statusOn
																	: styles.statusOff
															}`}
														>
															{device.enabled
																? "已开启"
																: "已关闭"}
														</span>
													</div>
													<div
														className={
															styles.listMeta
														}
													>
														<span
															className={
																styles.metaLabel
															}
														>
															管道号
														</span>
														<span
															className={`${styles.metaValue} ${metaActive ? styles.metaValueActive : ""}`}
														>
															{displayDash(
																device.pipeNo,
															)}
														</span>
														<span
															className={
																styles.metaGap
															}
														/>
														<span
															className={
																styles.metaLabel
															}
														>
															监控房
														</span>
														<span
															className={`${styles.metaValue} ${metaActive ? styles.metaValueActive : ""}`}
														>
															{displayDash(
																device.roomLabel,
															)}
														</span>
													</div>
												</button>
											);
										})
									: roomGroups.map((group) => {
											const active =
												selectedRoom?.key === group.key;
											const deviceCodes =
												previewDeviceCodes(
													group.devices,
												);
											return (
												<button
													key={group.key}
													type="button"
													className={`${styles.listItem} ${active ? styles.listItemActive : ""}`}
													onClick={() => {
														handleSelectRoom(
															group.key,
														);
													}}
												>
													<div
														className={
															styles.listItemTop
														}
													>
														<DeviceGlyph
															className={
																styles.listIcon
															}
														/>
														<span
															className={
																styles.listTitle
															}
														>
															房间：
															{displayDash(
																group.roomLabel,
															)}
														</span>
													</div>
													<div
														className={
															styles.listMeta
														}
													>
														<span
															className={
																styles.metaLabel
															}
														>
															管道号
														</span>
														<span
															className={`${styles.metaValue} ${active ? styles.metaValueActive : ""}`}
														>
															{displayDash(
																group.pipeNo,
															)}
														</span>
														<span
															className={
																styles.metaGap
															}
														/>
														<span
															className={
																styles.metaLabel
															}
														>
															设备编码
														</span>
														<span
															className={`${styles.metaValue} ${styles.metaCodes} ${active ? styles.metaValueActive : ""}`}
														>
															{displayDash(
																deviceCodes,
															)}
														</span>
													</div>
												</button>
											);
										})}
							</div>
						)}
					</aside>

					<section className={styles.detail}>
						{selected ? (
							<>
								<div className={styles.infoPanel}>
									<div className={styles.sectionTitle}>
										{infoTitle}
									</div>
									<div className={styles.sectionLine} />
									<div className={styles.infoCard}>
										<div
											className={`${styles.infoGrid} ${listMode === "room" ? styles.infoGridRoom : ""}`}
										>
											{infoCells.map(
												([label, value], index) => {
													const grow =
														listMode === "room" &&
														(label === "设备名称" ||
															label ===
																"设备编码");
													return (
														<div
															key={label}
															className={`${styles.infoCell} ${grow ? styles.infoCellGrow : ""}`}
														>
															{index === 0 ? (
																<span
																	className={
																		styles.infoAccent
																	}
																/>
															) : null}
															<span
																className={
																	styles.infoCellLabel
																}
															>
																{label}
															</span>
															<span
																className={
																	styles.infoCellValue
																}
															>
																{value}
															</span>
														</div>
													);
												},
											)}
										</div>
									</div>
								</div>

								<div className={styles.mainPanel}>
									<div className={styles.sectionTitle}>
										实时状态
									</div>
									<div className={styles.sectionLine} />
									{metricCards.length > 0 ? (
										<div className={styles.metricRow}>
											{metricCards.map((metric) => {
												const metricActive =
													Boolean(trendPropertyId) &&
													metric.propertyId ===
														trendPropertyId;
												const cardClassName = `${styles.metricCard} ${listMode === "room" ? styles.metricCardRoom : ""} ${metricActive ? styles.metricCardActive : ""}`;
												return (
													<button
														key={metric.key}
														type="button"
														className={
															cardClassName
														}
														onClick={() => {
															if (
																!metric.propertyId
															) {
																return;
															}
															setTrendPropertyId(
																metric.propertyId,
															);
														}}
													>
														<div
															className={
																styles.metricText
															}
														>
															<div
																className={
																	styles.metricLabel
																}
															>
																{metric.label}
															</div>
															{listMode ===
															"device" ? (
																<div
																	className={
																		styles.metricValueRow
																	}
																>
																	<span
																		className={
																			styles.metricValue
																		}
																	>
																		{formatMetric(
																			metric,
																		)}
																	</span>
																	<span
																		className={
																			styles.metricUnit
																		}
																	>
																		{metric.unit ||
																			"\u00A0"}
																	</span>
																</div>
															) : null}
														</div>
														<MetricGlyph
															type={getMetricIconKey(
																metric.label,
															)}
															className={
																styles.metricIcon
															}
														/>
													</button>
												);
											})}
										</div>
									) : (
										<div className={styles.metricEmpty}>
											<Empty />
										</div>
									)}

									{metricCards.length > 0 ? (
										<div className={styles.trendChart}>
										{listMode === "room" ? (
											<>
												<div className={styles.legend}>
													{roomTrendSeries.map(
														(item, index) => (
															<div
																key={`${item.name}-${index}`}
																className={
																	styles.legendItem
																}
															>
																<span
																	className={
																		styles.legendMark
																	}
																	style={{
																		background:
																			item.color,
																	}}
																/>
																<span
																	className={
																		styles.legendText
																	}
																>
																	{item.name}
																</span>
															</div>
														),
													)}
												</div>
												<div
													className={styles.chartWrap}
												>
													<LineChartsByRoom
														series={roomTrendSeries}
														onTimePage={
															handleRoomTrendTimePage
														}
														onRangeChange={
															handleRoomTrendRangeChange
														}
													/>
												</div>
											</>
										) : (
											<>
												<div className={styles.legend}>
													{trendChart.series.map(
														(item, index) => (
															<div
																key={`${item.name}-${index}`}
																className={
																	styles.legendItem
																}
															>
																<span
																	className={
																		styles.legendMark
																	}
																	style={{
																		background:
																			item.color,
																	}}
																/>
																<span
																	className={
																		styles.legendText
																	}
																>
																	{item.name}
																</span>
															</div>
														),
													)}
												</div>
												<div
													className={styles.chartWrap}
												>
													<LineCharts
														series={
															trendChart.series
														}
														onTimePage={
															handleDeviceTrendTimePage
														}
														onRangeChange={
															handleDeviceTrendRangeChange
														}
													/>
												</div>
											</>
										)}
										</div>
									) : null}
								</div>

								{listMode === "device" ? (
									<div className={styles.footer}>
										<Access
											code={
												PERM_DEVICE_CONTROL.SWITCH_DEVICE
											}
										>
											<Button
												type="primary"
												className={styles.actionBtn}
												onClick={() => {
													handleDeviceSwitch(
														!selected.enabled,
													);
												}}
												loading={loading}
											>
												{selected.enabled
													? "关闭设备"
													: "开启设备"}
											</Button>
										</Access>
										<div className={styles.footerActions}>
											<Button
												type="primary"
												className={styles.actionBtn}
												onClick={() => {
													setInstanceOpen(true);
												}}
											>
												实例配置
											</Button>
											<Button
												type="primary"
												className={styles.actionBtn}
												onClick={() => {
													setRoomOpen(true);
												}}
											>
												连接房间
											</Button>
											<Access
												code={PERM_DEVICE_CONTROL.CLEAN}
											>
												<Button
													type="primary"
													className={styles.actionBtn}
													onClick={() => {
														handleClean();
													}}
													loading={loading}
												>
													{selected.cleaning
														? "清洗中"
														: "设备清洗"}
												</Button>
											</Access>
										</div>
									</div>
								) : null}
							</>
						) : (
							<div className={styles.emptyWrap}>
								<Empty />
							</div>
						)}
					</section>
				</div>

				<InstanceModal
					open={instanceOpen}
					device={selected}
					getContainer={() => stageRef.current ?? document.body}
					onCancel={() => setInstanceOpen(false)}
					onOk={handleInstanceSubmit}
				/>
				<RoomModal
					open={roomOpen}
					device={selected}
					buildingId={currentBuilding?.buildingId ?? 0}
					getContainer={() => stageRef.current ?? document.body}
					onCancel={() => setRoomOpen(false)}
					onOk={handleRoomSubmit}
				/>
			</div>
		</div>
	);
};

export default DeviceControl;
