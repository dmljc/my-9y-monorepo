import { App } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	create,
	getAllDevices,
	list,
	performInspection,
	remove,
	update,
} from "./api";
import type {
	DeviceFormValues,
	DeviceListFilter,
	DeviceStats,
	InspectionDevice,
	StatCard,
	StatCardAssets,
} from "./types";
import { buildStatCards, getMockStats } from "./utils";

const EMPTY_FILTER: DeviceListFilter = {
	deviceName: "",
	factoryBuilding: "",
};

interface UseDeviceLedgerOptions {
	statCardAssets: StatCardAssets;
}

/** 点检台账列表页：数据加载、筛选、分页与 CRUD 操作 */
export const useDeviceLedger = ({ statCardAssets }: UseDeviceLedgerOptions) => {
	const { message: showMsg, modal: confirmModal } = App.useApp();

	const [draftFilter, setDraftFilter] =
		useState<DeviceListFilter>(EMPTY_FILTER);
	const [appliedFilter, setAppliedFilter] =
		useState<DeviceListFilter>(EMPTY_FILTER);

	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<InspectionDevice[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [stats, setStats] = useState<DeviceStats>(getMockStats);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<InspectionDevice | null>(
		null,
	);
	const [allDevices, setAllDevices] = useState<InspectionDevice[]>([]);
	const [inspectingId, setInspectingId] = useState<string | null>(null);

	const statCards: StatCard[] = useMemo(
		() => buildStatCards(stats, statCardAssets),
		[stats, statCardAssets],
	);

	const loadData = useCallback(
		async (
			p: number,
			ps: number,
			filter: DeviceListFilter = appliedFilter,
		) => {
			setLoading(true);
			try {
				const result = await list({
					pageNum: p,
					pageSize: ps,
					deviceName: filter.deviceName,
					factoryBuilding: filter.factoryBuilding,
				});
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
				setStats(result.stats);
				setAllDevices(getAllDevices());
			} catch {
				showMsg.error("加载点检台账失败");
			} finally {
				setLoading(false);
			}
		},
		[appliedFilter, showMsg],
	);

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			void loadData(1, pageSize);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSearch = useCallback(() => {
		const nextFilter: DeviceListFilter = {
			deviceName: draftFilter.deviceName.trim(),
			factoryBuilding: draftFilter.factoryBuilding,
		};
		setAppliedFilter(nextFilter);
		void loadData(1, pageSize, nextFilter);
	}, [draftFilter, loadData, pageSize]);

	const handleReset = useCallback(() => {
		setDraftFilter(EMPTY_FILTER);
		setAppliedFilter(EMPTY_FILTER);
		void loadData(1, pageSize, EMPTY_FILTER);
	}, [loadData, pageSize]);

	const handleTableChange = useCallback(
		(pagination: TablePaginationConfig) => {
			void loadData(
				pagination.current ?? 1,
				pagination.pageSize ?? pageSize,
			);
		},
		[loadData, pageSize],
	);

	const openAdd = useCallback(() => {
		setEditingRecord(null);
		setModalOpen(true);
	}, []);

	const openEdit = useCallback((record: InspectionDevice) => {
		setEditingRecord(record);
		setModalOpen(true);
	}, []);

	const closeModal = useCallback(() => setModalOpen(false), []);

	const handleModalOk = useCallback(
		async (values: DeviceFormValues) => {
			if (editingRecord) {
				await update(editingRecord.id, values);
				showMsg.success("更新成功");
			} else {
				await create(values);
				showMsg.success("创建成功");
			}
			await loadData(pageNum, pageSize);
		},
		[editingRecord, loadData, pageNum, pageSize, showMsg],
	);

	const handlePerformInspection = useCallback(
		async (record: InspectionDevice) => {
			setInspectingId(record.id);
			try {
				await performInspection(record.id);
				showMsg.success("点检完成");
				await loadData(pageNum, pageSize);
			} catch {
				showMsg.error("点检失败");
			} finally {
				setInspectingId(null);
			}
		},
		[loadData, pageNum, pageSize, showMsg],
	);

	const handleDelete = useCallback(
		(record: InspectionDevice) => {
			confirmModal.confirm({
				title: "确认删除",
				content: `确定要删除设备「${record.name}」吗？`,
				okText: "删除",
				okButtonProps: { danger: true },
				cancelText: "取消",
				onOk: async () => {
					await remove(record.id);
					showMsg.success("删除成功");
					await loadData(pageNum, pageSize);
				},
			});
		},
		[confirmModal, loadData, pageNum, pageSize, showMsg],
	);

	return {
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
	};
};
