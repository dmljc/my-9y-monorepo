import { PlusOutlined } from "@ant-design/icons";
import { App, Button, DatePicker, Empty, Pagination } from "antd";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { create, list, type TaskItem, toggleStatus, update } from "./api";
import CreateModal from "./CreateModal";
import styles from "./index.module.css";
import {
	buildSummaryItems,
	DEFAULT_FILTER,
	type FilterState,
	formatTaskPayload,
	type SummaryItem,
	TASK_STATUS_LABEL,
} from "./utils";

const { RangePicker } = DatePicker;

const Task = () => {
	const { message: showMsg } = App.useApp();
	const [tasks, setTasks] = useState<TaskItem[]>([]);
	const [total, setTotal] = useState(0);
	const [totalDone, setTotalDone] = useState(0);
	const [totalPending, setTotalPending] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [loading, setLoading] = useState(false);
	const [draftFilter, setDraftFilter] = useState<FilterState>(DEFAULT_FILTER);
	const [appliedFilter, setAppliedFilter] =
		useState<FilterState>(DEFAULT_FILTER);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<TaskItem | null>(null);

	const summaryItems = useMemo<SummaryItem[]>(
		() => buildSummaryItems(total, totalDone, totalPending),
		[total, totalDone, totalPending],
	);

	const loadData = useCallback(
		async (p: number, ps: number) => {
			setLoading(true);
			try {
				const params: {
					pageNum: number;
					pageSize: number;
					startTime?: string;
					endTime?: string;
				} = {
					pageNum: p,
					pageSize: ps,
				};
				if (appliedFilter.dateRange) {
					params.startTime =
						appliedFilter.dateRange[0].format("YYYY-MM-DD HH:mm");
					params.endTime =
						appliedFilter.dateRange[1].format("YYYY-MM-DD HH:mm");
				}
				const result = await list(params);
				setTasks(result.list);
				setTotal(result.total);
				setTotalDone(result.totalDone);
				setTotalPending(result.totalPending);
				setPageNum(result.pageNum);
				setPageSize(result.pageSize);
			} catch {
				showMsg.error("加载任务列表失败");
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

	const handleConfirm = () => {
		const nextFilter = { ...draftFilter };
		setAppliedFilter(nextFilter);
		setPageNum(1);
		void loadData(1, pageSize);
	};

	const handlePageChange = (p: number, ps: number) => {
		setPageNum(p);
		setPageSize(ps);
		void loadData(p, ps);
	};

	const openAdd = () => {
		setEditingRecord(null);
		setModalOpen(true);
	};

	const openEdit = (record: TaskItem) => {
		setEditingRecord(record);
		setModalOpen(true);
	};

	const handleModalSuccess = async (
		values: {
			title: string;
			area: string;
			device: string;
			taskTime: [Dayjs, Dayjs];
		},
		editingId: string | null,
	) => {
		const payload = formatTaskPayload(values);
		try {
			if (editingId) {
				await update(editingId, payload);
				showMsg.success("更新成功");
			} else {
				await create(payload);
				showMsg.success("创建成功");
			}
			await loadData(pageNum, pageSize);
		} catch {
			showMsg.error(editingId ? "更新失败" : "创建失败");
		}
	};

	const handleToggleStatus = async (record: TaskItem) => {
		const nextStatus = record.status === "done" ? "pending" : "done";
		try {
			await toggleStatus(record.id, nextStatus);
			showMsg.success(
				nextStatus === "done" ? "已标记完成" : "已撤销完成",
			);
			await loadData(pageNum, pageSize);
		} catch {
			showMsg.error("状态更新失败");
		}
	};

	return (
		<div className={styles.task}>
			<section className={styles.topPanel}>
				<div className={styles.summaryCards}>
					{summaryItems.map((item) => (
						<div
							key={item.label}
							className={`${styles.summaryCard} ${styles[`summaryCard${item.tone}`]}`}
						>
							<div className={styles.summaryContent}>
								<div className={styles.summaryTitle}>
									{item.label}
								</div>
								<div className={styles.summaryValue}>
									{item.value}
								</div>
							</div>
							<div
								className={styles.summaryIllustration}
								aria-hidden
							>
								<span className={styles.dotWarm} />
								<span className={styles.dotCool} />
								<span className={styles.folderIcon}>
									<span className={styles.folderPaper} />
									<span className={styles.folderBack} />
									<span className={styles.folderFront} />
								</span>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className={styles.filterBar}>
				<div className={styles.filterItem}>
					<span className={styles.filterLabel}>时间选择</span>
					<RangePicker
						placeholder={["开始时间", "结束时间"]}
						format="YYYY-MM-DD HH:mm"
						showTime={{ format: "HH:mm" }}
						value={draftFilter.dateRange}
						allowClear
						onChange={(dates) =>
							setDraftFilter((prev) => ({
								...prev,
								dateRange: dates as [Dayjs, Dayjs] | null,
							}))
						}
					/>
				</div>
				<Button type="primary" onClick={handleConfirm}>
					确定
				</Button>
			</section>

			<section className={styles.listPanel}>
				<div className={styles.panelHeader}>
					<div className={styles.panelHeaderMain}>
						<span className={styles.panelIcon} aria-hidden />
						<span className={styles.panelTitle}>任务列表</span>
					</div>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={openAdd}
					>
						新增任务
					</Button>
				</div>

				<div className={styles.taskList}>
					{loading ? null : tasks.length > 0 ? (
						tasks.map((task) => (
							<article key={task.id} className={styles.taskCard}>
								<div className={styles.taskMain}>
									<div className={styles.taskHeader}>
										<span
											className={styles.taskBar}
											aria-hidden
										/>
										<h3 className={styles.taskTitle}>
											{task.title}
										</h3>
										<span
											className={`${styles.statusTag} ${styles[`status${task.status}`]}`}
										>
											{TASK_STATUS_LABEL[task.status]}
										</span>
									</div>
									<div className={styles.taskMeta}>
										<time dateTime={task.time}>
											{task.time}
										</time>
										<span className={styles.metaSplit} />
										<span>{task.area}</span>
										<span className={styles.metaSplit} />
										<span>{task.device}</span>
									</div>
								</div>
								<div className={styles.taskActions}>
									<Button
										type="link"
										className={styles.editButton}
										onClick={() => openEdit(task)}
									>
										编辑
									</Button>
									<Button
										className={styles.completeButton}
										onClick={() => handleToggleStatus(task)}
									>
										{task.status === "done"
											? "撤销完成"
											: "标记完成"}
									</Button>
								</div>
							</article>
						))
					) : (
						<div className={styles.emptyWrap}>
							<Empty description="暂无符合条件的任务" />
						</div>
					)}
				</div>

				{total > 0 && (
					<div className={styles.paginationWrap}>
						<Pagination
							current={pageNum}
							pageSize={pageSize}
							total={total}
							showSizeChanger
							showQuickJumper
							showTotal={(count: number) => `共 ${count} 条`}
							onChange={handlePageChange}
						/>
					</div>
				)}
			</section>

			<CreateModal
				open={modalOpen}
				editingRecord={editingRecord}
				onCancel={() => setModalOpen(false)}
				onSuccess={handleModalSuccess}
			/>
		</div>
	);
};

export default Task;
