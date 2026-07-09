import { Button, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Access from "@/components/Access";
import { PERM_INSPECTION_LEDGER } from "@/constants/permission";
import type { DeviceLedger } from "./interface";
import { DATE_FORMAT, TYPE_OPTIONS } from "./utils";

const TYPE_LABEL = Object.fromEntries(
	TYPE_OPTIONS.map(({ label, value }) => [value, label]),
);

const CYCLE_UNIT_LABEL: Record<string, string> = {
	day: "天",
	month: "月",
};

const STATUS_LABEL: Record<string, string> = {
	normal: "正常",
	expiring_soon: "即将到期",
	overdue: "逾期未检",
	"0": "正常",
	"1": "即将到期",
	"2": "逾期未检",
};

const STATUS_COLOR: Record<string, string> = {
	normal: "success",
	expiring_soon: "warning",
	overdue: "error",
	"0": "success",
	"1": "warning",
	"2": "error",
};

const formatCycleText = (
	cycleValue?: number,
	cycleUnit?: string,
	cycleText?: string,
): string => {
	if (cycleText?.trim()) return cycleText;
	if (!cycleValue || !cycleUnit) return "";
	const unitLabel = CYCLE_UNIT_LABEL[cycleUnit] ?? cycleUnit;
	return `每${cycleValue}${unitLabel}`;
};

const formatInspectionDate = (value?: string): string => {
	if (!value) return "";
	const parsed = dayjs(value);
	return parsed.isValid() ? parsed.format(DATE_FORMAT) : value;
};

export interface DeviceTableColumnOptions {
	pageNum: number;
	pageSize: number;
	inspectingId: number | null;
	actionsClassName: string;
	onPerformInspection: (record: DeviceLedger) => void;
	onEdit: (record: DeviceLedger) => void;
	onDelete: (record: DeviceLedger) => void;
}

/**
 * 构建点检台账表格列。
 */
export const buildDeviceTableColumns = ({
	pageNum,
	pageSize,
	inspectingId,
	actionsClassName,
	onPerformInspection,
	onEdit,
	onDelete,
}: DeviceTableColumnOptions): ColumnsType<DeviceLedger> => [
	{
		title: "序号",
		key: "index",
		width: 72,
		align: "center",
		fixed: "left",
		render: (_: unknown, __: DeviceLedger, index: number) =>
			(pageNum - 1) * pageSize + index + 1,
	},
	{
		title: "设备编码",
		dataIndex: "deviceCode",
		key: "deviceCode",
		ellipsis: true,
	},
	{
		title: "设备名称",
		dataIndex: "deviceName",
		key: "deviceName",
		ellipsis: true,
	},
	{
		title: "型号",
		dataIndex: "deviceType",
		key: "deviceType",
		ellipsis: true,
	},
	{
		title: "设备类型",
		dataIndex: "deviceType",
		key: "deviceType",
		ellipsis: true,
		render: (type: string) => TYPE_LABEL[type] ?? type,
	},
	{
		title: "厂家",
		dataIndex: "manufacturer",
		key: "manufacturer",
		ellipsis: true,
	},
	{
		title: "所属厂房",
		dataIndex: "building",
		key: "building",
		ellipsis: true,
	},
	{
		title: "所属房间",
		dataIndex: "room",
		key: "room",
		ellipsis: true,
	},
	{
		title: "点检周期",
		key: "cycle",
		ellipsis: true,
		render: (_: unknown, record) =>
			formatCycleText(
				record.cycleValue,
				record.cycleUnit,
				record.cycleText,
			),
	},
	{
		title: "上次点检",
		dataIndex: "lastInspection",
		key: "lastInspection",
		ellipsis: true,
		render: (value: string) => formatInspectionDate(value),
	},
	{
		title: "下次点检",
		dataIndex: "nextInspection",
		key: "nextInspection",
		ellipsis: true,
		render: (value: string) => formatInspectionDate(value),
	},
	{
		title: "状态",
		dataIndex: "status",
		key: "status",
		render: (status?: string) => {
			if (!status) return null;
			const label = STATUS_LABEL[status] ?? status;
			const color = STATUS_COLOR[status] ?? "default";
			return <Tag color={color}>{label}</Tag>;
		},
	},
	{
		title: "操作",
		key: "actions",
		fixed: "right",
		width: 180,
		render: (_: unknown, record: DeviceLedger) => (
			<div className={actionsClassName}>
				<Access code={PERM_INSPECTION_LEDGER.INSPECT}>
					<Button
						type="link"
						size="small"
						loading={inspectingId === record.id}
						onClick={() => onPerformInspection(record)}
					>
						执行点检
					</Button>
				</Access>
				<Access code={PERM_INSPECTION_LEDGER.EDIT}>
					<Button
						type="link"
						size="small"
						onClick={() => onEdit(record)}
					>
						编辑
					</Button>
				</Access>
				<Access code={PERM_INSPECTION_LEDGER.DELETE}>
					<Button
						type="link"
						size="small"
						onClick={() => onDelete(record)}
					>
						删除
					</Button>
				</Access>
			</div>
		),
	},
];
