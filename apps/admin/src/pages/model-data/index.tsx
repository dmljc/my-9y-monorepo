import { App, Button, Empty, Input, Select, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { list, type ModelDataRecord } from "./api";
import styles from "./index.module.css";
import {
	ASSET_TYPE_LABEL,
	ASSET_TYPE_OPTIONS,
	DATA_TYPE_OPTIONS,
	DEFAULT_FILTER,
	type ModelDataFilter,
	toListParams,
} from "./utils";

const ModelData = () => {
	const { message: showMsg } = App.useApp();
	const [draftFilter, setDraftFilter] =
		useState<ModelDataFilter>(DEFAULT_FILTER);
	const [appliedFilter, setAppliedFilter] =
		useState<ModelDataFilter>(DEFAULT_FILTER);
	const [tableLoading, setTableLoading] = useState(false);
	const [dataSource, setDataSource] = useState<ModelDataRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const loadData = useCallback(
		async (
			p: number,
			ps: number,
			filter: ModelDataFilter = appliedFilter,
		) => {
			setTableLoading(true);
			try {
				const result = await list(toListParams(p, ps, filter));
				setDataSource(result.list);
				setTotal(result.total);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				showMsg.error("加载物模型数据失败");
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

	const columns = useMemo<ColumnsType<ModelDataRecord>>(
		() => [
			{
				title: "物模型名称",
				dataIndex: "modelName",
				key: "modelName",
				width: 120,
				ellipsis: true,
			},
			{
				title: "物模型标识",
				dataIndex: "modelKey",
				key: "modelKey",
				width: 140,
				ellipsis: true,
			},
			{
				title: "资产类型",
				dataIndex: "assetType",
				key: "assetType",
				width: 100,
				render: (type: ModelDataRecord["assetType"]) => (
					<Tag color={type === "device" ? "blue" : "cyan"}>
						{ASSET_TYPE_LABEL[type]}
					</Tag>
				),
			},
			{
				title: "属性名称",
				dataIndex: "propertyName",
				key: "propertyName",
				width: 120,
				ellipsis: true,
			},
			{
				title: "属性标识",
				dataIndex: "propertyKey",
				key: "propertyKey",
				ellipsis: true,
			},
			{
				title: "数据类型",
				dataIndex: "dataType",
				key: "dataType",
				width: 100,
			},
			{
				title: "单位",
				dataIndex: "unit",
				key: "unit",
				width: 80,
			},
			{
				title: "描述",
				dataIndex: "description",
				key: "description",
				ellipsis: true,
			},
		],
		[],
	);

	return (
		<div className={styles.modelData}>
			<section className={styles.panel}>
				<div className={styles.filterBar}>
					<div className={styles.filterItem}>
						<span className={styles.filterLabel}>物模型名称</span>
						<Input
							className={styles.modelNameInput}
							placeholder="请输入物模型名称"
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
					</div>

					<div className={styles.filterItem}>
						<span className={styles.filterLabel}>资产类型</span>
						<Select
							className={styles.filterSelect}
							placeholder="请选择"
							allowClear
							options={ASSET_TYPE_OPTIONS}
							value={draftFilter.assetType}
							onChange={(value) =>
								setDraftFilter((prev) => ({
									...prev,
									assetType: value,
								}))
							}
						/>
					</div>

					<div className={styles.filterItem}>
						<span className={styles.filterLabel}>数据类型</span>
						<Select
							className={styles.filterSelect}
							placeholder="请选择"
							allowClear
							options={DATA_TYPE_OPTIONS}
							value={draftFilter.dataType}
							onChange={(value) =>
								setDraftFilter((prev) => ({
									...prev,
									dataType: value,
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
				</div>

				<div className={styles.tableWrap}>
					<Table
						size="middle"
						className={styles.modelDataTable}
						columns={columns}
						dataSource={dataSource}
						rowKey="id"
						loading={tableLoading}
						scroll={{ x: 1100 }}
						locale={{
							emptyText: <Empty description="暂无物模型数据" />,
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

export default ModelData;
