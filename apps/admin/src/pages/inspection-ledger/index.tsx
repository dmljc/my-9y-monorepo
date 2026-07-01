import { PlusOutlined } from "@ant-design/icons";
import { Button, Input, Select, Table } from "antd";
import { useMemo } from "react";
import cardBlueCircleImg from "@/assets/warning/card-blue-circle.png";
import cardGreenCircleImg from "@/assets/warning/card-green-circle.png";
import statUnprocessedImg from "@/assets/warning/stat-unprocessed.png";
import statWarningCountImg from "@/assets/warning/stat-warning-count.png";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import { buildDeviceTableColumns } from "./tableColumns";
import type { StatCard } from "./types";
import { useDeviceLedger } from "./useDeviceLedger";
import { FACTORY_OPTIONS } from "./utils";

const STAT_CARD_ASSETS = {
	totalImg: statWarningCountImg,
	expiringImg: statUnprocessedImg,
	overdueImg: statUnprocessedImg,
	blueCircleBg: cardBlueCircleImg,
	greenCircleBg: cardGreenCircleImg,
} as const;

const STAT_CARD_TONE_CLASS = {
	blue: styles.summaryCardBlue,
	green: styles.summaryCardGreen,
	orange: styles.summaryCardOrange,
} as const;

function StatCardView({ card }: { card: StatCard }) {
	return (
		<div
			className={`${styles.summaryCard} ${STAT_CARD_TONE_CLASS[card.tone]}`}
			style={{ backgroundImage: `url(${card.background})` }}
		>
			<div className={styles.summaryCardTitle}>{card.title}</div>
			<div
				className={styles.summaryCardValue}
				style={card.valueColor ? { color: card.valueColor } : undefined}
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
	);
}

const InspectionLedger = () => {
	const {
		draftFilter,
		setDraftFilter,
		loading,
		dataSource,
		total,
		pageNum,
		pageSize,
		statCards,
		modalOpen,
		editingRecord,
		allDevices,
		inspectingId,
		handleSearch,
		handleReset,
		handleTableChange,
		openAdd,
		openEdit,
		closeModal,
		handleModalOk,
		handlePerformInspection,
		handleDelete,
	} = useDeviceLedger({ statCardAssets: STAT_CARD_ASSETS });

	const columns = useMemo(
		() =>
			buildDeviceTableColumns({
				pageNum,
				pageSize,
				inspectingId,
				actionsClassName: styles.actions,
				onPerformInspection: handlePerformInspection,
				onEdit: openEdit,
				onDelete: handleDelete,
			}),
		[
			pageNum,
			pageSize,
			inspectingId,
			handlePerformInspection,
			openEdit,
			handleDelete,
		],
	);

	return (
		<div className={styles.warning}>
			<div className={styles.topPanel}>
				<div className={styles.summaryCards}>
					{statCards.map((card) => (
						<StatCardView key={card.key} card={card} />
					))}
				</div>
			</div>

			<div className={styles.filterBar}>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>设备名称</span>
					<Input
						placeholder="请输入设备名称"
						value={draftFilter.deviceName}
						allowClear
						onChange={(event) =>
							setDraftFilter((prev) => ({
								...prev,
								deviceName: event.target.value,
							}))
						}
						onPressEnter={handleSearch}
					/>
				</div>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>所属厂房</span>
					<Select
						className={styles.filterSelect}
						value={draftFilter.factoryBuilding}
						options={FACTORY_OPTIONS}
						onChange={(value) =>
							setDraftFilter((prev) => ({
								...prev,
								factoryBuilding: value,
							}))
						}
					/>
				</div>
				<div className={styles.filterActions}>
					<Button type="primary" onClick={handleSearch}>
						查询
					</Button>
					<Button onClick={handleReset}>重置</Button>
				</div>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={openAdd}
					style={{ marginLeft: "auto" }}
				>
					新增设备
				</Button>
			</div>

			<div className={styles.listPanel}>
				<Table
					size="small"
					className={styles.warningTable}
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
						showQuickJumper: true,
						showTotal: (count) => `共 ${count} 条`,
					}}
					onChange={handleTableChange}
				/>
			</div>

			<CreateModal
				open={modalOpen}
				editingRecord={editingRecord}
				existingDevices={allDevices}
				onCancel={closeModal}
				onOk={handleModalOk}
			/>
		</div>
	);
};

export default InspectionLedger;
