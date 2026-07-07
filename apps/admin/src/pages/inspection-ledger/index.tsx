import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Input, Select, Table } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import cardBlueCircleImg from "@/assets/inspection-ledger/card-blue-circle.png";
import cardOrangeCircleImg from "@/assets/inspection-ledger/card-orange-circle.png";
import cardPurpleCircleImg from "@/assets/inspection-ledger/card-purple-circle.png";
import statExpiringImg from "@/assets/inspection-ledger/stat-expiring.png";
import statOverdueImg from "@/assets/inspection-ledger/stat-overdue.png";
import statTotalImg from "@/assets/inspection-ledger/stat-total.png";
import {
	create,
	buildings as fetchBuildings,
	stats as fetchStats,
	inspect,
	list,
	remove,
	update,
} from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import type {
	DeviceFormValues,
	DeviceLedger,
	DeviceLedgerStats,
} from "./interface";
import { buildDeviceTableColumns } from "./tableColumns";
import {
	buildStatCards,
	normalizeBuildingOptions,
	normalizeStats,
	toApiDateTime,
} from "./utils";

const EMPTY_STATS: DeviceLedgerStats = {
	total: 0,
	expiringSoon: 0,
	overdue: 0,
};

const STAT_CARD_GRADIENT = {
	blue: "linear-gradient(90deg, #e6f3ff 0%, #c9e3ff 100%)",
	purple: "linear-gradient(90deg, #f8f6ff 0%, #e7e0ff 100%)",
	orange: "linear-gradient(90deg, #fff5e1 0%, #ffdec1 100%)",
} as const;

const STAT_CARD_ASSETS = {
	totalImg: statTotalImg,
	expiringImg: statExpiringImg,
	overdueImg: statOverdueImg,
	blueCircleBg: cardBlueCircleImg,
	purpleCircleBg: cardPurpleCircleImg,
	orangeCircleBg: cardOrangeCircleImg,
} as const;

const STAT_CARD_TONE_CLASS = {
	blue: styles.summaryCardBlue,
	purple: styles.summaryCardPurple,
	orange: styles.summaryCardOrange,
} as const;

const InspectionLedger = () => {
	const { message, modal } = App.useApp();

	const [deviceName, setDeviceName] = useState("");
	const [building, setBuilding] = useState("");
	const [buildingOptions, setBuildingOptions] = useState(
		normalizeBuildingOptions([]),
	);

	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<DeviceLedger[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(15);
	const [stats, setStats] = useState<DeviceLedgerStats>(EMPTY_STATS);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<DeviceLedger | null>(
		null,
	);
	const [inspectingId, setInspectingId] = useState<number | null>(null);

	const statCards = buildStatCards(stats, STAT_CARD_ASSETS);

	const loadStats = async () => {
		const statsData = await fetchStats();
		setStats(normalizeStats(statsData ?? {}));
	};

	const loadBuildings = async () => {
		const buildingsData = await fetchBuildings();
		setBuildingOptions(normalizeBuildingOptions(buildingsData));
	};

	const loadData = async (
		p: number,
		ps: number,
		filters?: { deviceName?: string; building?: string },
	) => {
		const active = filters ?? { deviceName, building };

		setLoading(true);
		try {
			const listData = await list({
				pageNum: p,
				pageSize: ps,
				deviceName: active.deviceName?.trim(),
				building: active.building,
			});

			setDataSource(listData.list ?? []);
			setTotal(listData.total ?? 0);
			setPageNum(listData.pageNum ?? p);
			setPageSize(listData.pageSize ?? ps);
		} finally {
			setLoading(false);
		}
	};

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			loadStats();
			loadBuildings();
			loadData(1, pageSize, { deviceName: "", building: "" });
		}
	}, []);

	const handleSearch = () => {
		setPageNum(1);
		loadData(1, pageSize);
	};

	const handleReset = () => {
		setDeviceName("");
		setBuilding("");
		setPageNum(1);
		loadData(1, pageSize, { deviceName: "", building: "" });
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		loadData(pagination.current ?? 1, pagination.pageSize ?? pageSize);
	};

	const handleAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	const handleEdit = (record: DeviceLedger) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSubmit = async (values: DeviceFormValues) => {
		const payload: DeviceLedger = {
			deviceCode: values.deviceCode.trim(),
			deviceName: values.deviceName.trim(),
			deviceType: values.deviceType,
			manufacturer: values.manufacturer.trim(),
			building: values.building,
			room: values.room,
			cycleValue: values.cycleValue,
			cycleUnit: values.cycleUnit,
			lastInspection: toApiDateTime(values.lastInspection),
		};
		if (editingRecord?.id !== undefined) {
			await update({ ...payload, id: editingRecord.id });
			message.success("编辑成功");
		} else {
			await create(payload);
			message.success("新增成功");
		}
		await loadStats();
		await loadData(pageNum, pageSize);
	};

	const handlePerformInspection = async (record: DeviceLedger) => {
		const id = record.id;
		if (id === undefined) return;
		modal.confirm({
			title: "确认执行点检",
			content: `确定要执行设备「${record.deviceName ?? ""}」的点检吗？`,
			okText: "执行点检",
			onOk: async () => {
				setInspectingId(id);
				try {
					await inspect(id);
					message.success("点检完成");
					await loadStats();
					await loadData(pageNum, pageSize);
				} finally {
					setInspectingId(null);
				}
			},
		});
	};

	const handleDelete = (record: DeviceLedger) => {
		if (record.id === undefined) return;
		modal.confirm({
			title: "确认删除",
			content: `确定要删除设备「${record.deviceName ?? ""}」吗？`,
			okText: "删除",
			okButtonProps: { danger: true },
			onOk: async () => {
				await remove(String(record.id));
				message.success("删除成功");
				await loadStats();
				await loadData(pageNum, pageSize);
			},
		});
	};

	const columns = buildDeviceTableColumns({
		pageNum,
		pageSize,
		inspectingId,
		actionsClassName: styles.actions,
		onPerformInspection: handlePerformInspection,
		onEdit: handleEdit,
		onDelete: handleDelete,
	});

	return (
		<div className={styles.inspectionLedger}>
			<div className={styles.topPanel}>
				<div className={styles.summaryCards}>
					{statCards.map((card) => (
						<div
							key={card.key}
							className={`${styles.summaryCard} ${STAT_CARD_TONE_CLASS[card.tone]}`}
							style={{
								backgroundImage: `url(${card.background}), ${STAT_CARD_GRADIENT[card.tone]}`,
							}}
						>
							<div className={styles.summaryCardTitle}>
								{card.title}
							</div>
							<div
								className={styles.summaryCardValue}
								style={
									card.valueColor
										? { color: card.valueColor }
										: undefined
								}
							>
								{card.value}
							</div>
							<img
								className={styles.summaryCardIllustration}
								src={card.image}
								alt=""
								draggable={false}
							/>
						</div>
					))}
				</div>
			</div>

			<div className={styles.filterBar}>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>设备名称</span>
					<Input
						placeholder="请输入设备名称"
						value={deviceName}
						allowClear
						onChange={(event) => setDeviceName(event.target.value)}
						onPressEnter={handleSearch}
					/>
				</div>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>所属厂房</span>
					<Select
						className={styles.filterSelect}
						value={building}
						options={buildingOptions}
						onChange={setBuilding}
					/>
				</div>
				<div className={styles.filterActions}>
					<Button type="primary" onClick={handleSearch}>
						查询
					</Button>
					<Button onClick={handleReset}>重置</Button>
				</div>
				<div className={styles.panelActions}>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={handleAdd}
					>
						新增
					</Button>
				</div>
			</div>

			<div className={styles.listPanel}>
				<Table
					size="small"
					columns={columns}
					dataSource={dataSource}
					rowKey="id"
					loading={loading}
					scroll={{ x: 1400 }}
					pagination={{
						current: pageNum,
						pageSize,
						total,
						showSizeChanger: true,
						pageSizeOptions: ["10", "15", "20", "50", "100"],
						showQuickJumper: true,
						showTotal: (count) => `共 ${count} 条`,
					}}
					onChange={handleTableChange}
				/>
			</div>

			<CreateModal
				open={modalOpen}
				editingRecord={editingRecord}
				onCancel={() => setModalOpen(false)}
				onOk={handleModalSubmit}
			/>
		</div>
	);
};

export default InspectionLedger;
