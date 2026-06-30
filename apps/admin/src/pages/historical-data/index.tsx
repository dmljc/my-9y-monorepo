import { App, Button, DatePicker, Empty, Input, Select, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type DeviceRecord, list } from "./api";
import styles from "./index.module.css";
import {
	DEFAULT_FILTER,
	type DeviceFilter,
	PROPERTY_OPTIONS,
	parseFilterFromSearch,
	toListParams,
} from "./utils";

const { RangePicker } = DatePicker;

const HistoricalData = () => {
	const { message: showMsg } = App.useApp();
	const [searchParams] = useSearchParams();
	const [draftFilter, setDraftFilter] = useState<DeviceFilter>(() =>
		parseFilterFromSearch(searchParams.toString()),
	);
	const [appliedFilter, setAppliedFilter] = useState<DeviceFilter>(() =>
		parseFilterFromSearch(searchParams.toString()),
	);
	const [tableLoading, setTableLoading] = useState(false);
	const [dataSource, setDataSource] = useState<DeviceRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const loadData = useCallback(
		async (p: number, ps: number, filter: DeviceFilter = appliedFilter) => {
			setTableLoading(true);
			try {
				const result = await list(toListParams(p, ps, filter));
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				showMsg.error("加载历史数据失败");
			} finally {
				setTableLoading(false);
			}
		},
		[appliedFilter, showMsg],
	);

	const initRef = useRef(false);
	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			void loadData(pageNum, pageSize, appliedFilter);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSearch = () => {
		setAppliedFilter({ ...draftFilter });
		setPageNum(1);
		void loadData(1, pageSize, draftFilter);
	};

	const handleReset = () => {
		setDraftFilter(DEFAULT_FILTER);
		setAppliedFilter(DEFAULT_FILTER);
		setPageNum(1);
		void loadData(1, pageSize, DEFAULT_FILTER);
	};

	const handleTableChange = (pagination: TablePaginationConfig) => {
		const nextPageNum = pagination.current ?? 1;
		const nextPageSize = pagination.pageSize ?? 10;
		setPageNum(nextPageNum);
		setPageSize(nextPageSize);
		void loadData(nextPageNum, nextPageSize);
	};

	const columns = useMemo<ColumnsType<DeviceRecord>>(
		() => [
			{
				title: "序号",
				key: "index",
				width: 72,
				align: "center",
				render: (_: unknown, __: DeviceRecord, index: number) =>
					(pageNum - 1) * pageSize + index + 1,
			},
			{
				title: "物模型名称",
				dataIndex: "modelName",
				key: "modelName",
				ellipsis: true,
			},
			{
				title: "点位名称",
				dataIndex: "pointName",
				key: "pointName",
				ellipsis: true,
			},
			{
				title: "点位ID",
				dataIndex: "pointId",
				key: "pointId",
				ellipsis: true,
			},
			{
				title: "类型",
				dataIndex: "type",
				key: "type",
			},
			{
				title: "值",
				dataIndex: "value",
				key: "value",
			},
			{
				title: "时间",
				dataIndex: "time",
				key: "time",
			},
		],
		[pageNum, pageSize],
	);

	return (
		<div className={styles.historicalData}>
			<section className={styles.panel}>
				<div className={styles.filterBar}>
					<span className={styles.filterLabel}>物模型名称：</span>
					<Input
						className={styles.modelNameInput}
						placeholder="请输入物模型名称查询"
						value={draftFilter.modelName}
						allowClear
						onChange={(event) =>
							setDraftFilter((prev) => ({
								...prev,
								modelName: event.target.value,
							}))
						}
						onPressEnter={handleSearch}
					/>

					<div className={styles.filterItem}>
						<span className={styles.filterLabel}>点位名称</span>
						<Select
							className={styles.filterSelect}
							placeholder="请选择"
							allowClear
							options={PROPERTY_OPTIONS}
							value={draftFilter.property}
							onChange={(value) =>
								setDraftFilter((prev) => ({
									...prev,
									property: value,
								}))
							}
						/>
					</div>

					<div className={styles.filterItem}>
						<span className={styles.filterLabel}>时间</span>
						<RangePicker
							format="YYYY-MM-DD HH:mm"
							showTime={{ format: "HH:mm" }}
							className={styles.filterRange}
							placeholder={["开始时间", "结束时间"]}
							value={
								draftFilter.dateRange
									? [
											dayjs(draftFilter.dateRange[0]),
											dayjs(draftFilter.dateRange[1]),
										]
									: null
							}
							onChange={(_, dateStrings) => {
								const [start, end] = dateStrings;
								setDraftFilter((prev) => ({
									...prev,
									dateRange:
										start && end ? [start, end] : null,
								}));
							}}
						/>
					</div>

					<div className={styles.filterActions}>
						<Button type="primary" onClick={handleSearch}>
							查询
						</Button>
						<Button onClick={handleReset}>重置</Button>
					</div>
				</div>

				<div className={styles.tableWrap}>
					<Table
						size="middle"
						className={styles.historicalDataTable}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={tableLoading}
						scroll={{ x: 960 }}
						locale={{
							emptyText: <Empty description="暂无历史数据" />,
						}}
						pagination={{
							current: pageNum,
							pageSize,
							total,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (count: number) => `共 ${count} 条`,
						}}
						onChange={handleTableChange}
					/>
				</div>
			</section>
		</div>
	);
};

export default HistoricalData;
