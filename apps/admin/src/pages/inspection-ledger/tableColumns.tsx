import { Button, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { InspectionDevice } from "./types";
import {
	DEVICE_TYPE_LABEL,
	formatCycleText,
	STATUS_COLOR,
	STATUS_LABEL,
} from "./utils";

export interface DeviceTableColumnOptions {
	pageNum: number;
	pageSize: number;
	inspectingId: string | null;
	actionsClassName: string;
	onPerformInspection: (record: InspectionDevice) => void;
	onEdit: (record: InspectionDevice) => void;
	onDelete: (record: InspectionDevice) => void;
}

/** 构建点检台账表格列（列定义集中维护，便于后续增删字段） */
export const buildDeviceTableColumns = ({
	pageNum,
	pageSize,
	inspectingId,
	actionsClassName,
	onPerformInspection,
	onEdit,
	onDelete,
}: DeviceTableColumnOptions): ColumnsType<InspectionDevice> => [
	{
		title: "序号",
		key: "index",
		width: 72,
		align: "center",
		fixed: "left",
		render: (_: unknown, __: InspectionDevice, index: number) =>
			(pageNum - 1) * pageSize + index + 1,
	},
	{
		title: "设备编码",
		dataIndex: "code",
		key: "code",
		width: 100,
	},
	{
		title: "设备名称",
		dataIndex: "name",
		key: "name",
		width: 120,
		ellipsis: true,
	},
	{
		title: "设备类型",
		dataIndex: "deviceType",
		key: "deviceType",
		width: 100,
		render: (type: string) => DEVICE_TYPE_LABEL[type] ?? type,
	},
	{
		title: "厂家",
		dataIndex: "manufacturer",
		key: "manufacturer",
		width: 100,
		ellipsis: true,
	},
	{
		title: "所属厂房",
		dataIndex: "factoryBuilding",
		key: "factoryBuilding",
		width: 100,
	},
	{
		title: "所属房间",
		dataIndex: "room",
		key: "room",
		width: 90,
	},
	{
		title: "点检周期",
		key: "cycle",
		width: 100,
		render: (_: unknown, record) =>
			formatCycleText(record.cycleValue, record.cycleUnit),
	},
	{
		title: "上次点检",
		dataIndex: "lastInspectionDate",
		key: "lastInspectionDate",
		width: 110,
	},
	{
		title: "下次点检",
		dataIndex: "nextInspectionDate",
		key: "nextInspectionDate",
		width: 110,
	},
	{
		title: "状态",
		dataIndex: "status",
		key: "status",
		width: 100,
		render: (status: InspectionDevice["status"]) => (
			<Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
		),
	},
	{
		title: "操作",
		key: "actions",
		width: 220,
		fixed: "right",
		render: (_: unknown, record: InspectionDevice) => (
			<div className={actionsClassName}>
				<Button
					type="link"
					size="small"
					loading={inspectingId === record.id}
					onClick={() => onPerformInspection(record)}
				>
					执行点检
				</Button>
				<Button type="link" size="small" onClick={() => onEdit(record)}>
					编辑
				</Button>
				<Button
					type="link"
					size="small"
					onClick={() => onDelete(record)}
				>
					删除
				</Button>
			</div>
		),
	},
];
