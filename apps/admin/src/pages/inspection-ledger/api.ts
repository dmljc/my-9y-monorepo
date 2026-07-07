import { request } from "@/utils";
import type {
	DeviceLedger,
	DeviceLedgerListQuery,
	RoomListQuery,
} from "./interface";

export const list = (data: DeviceLedgerListQuery): Promise<any> => {
	return request.get("/device/inspection-ledger/list", { params: data });
};

export const stats = (): Promise<any> => {
	return request.get("/device/inspection-ledger/stats");
};

export const buildings = (): Promise<any> => {
	return request.get("/iiot/alarm/buildings");
};

export const rooms = (data: RoomListQuery): Promise<any> => {
	return request.get("/iiot/alarm/rooms", { params: data });
};

export const detail = (id: number): Promise<any> => {
	return request.get(`/device/inspection-ledger/${id}`);
};

export const create = (data: DeviceLedger): Promise<any> => {
	return request.post("/device/inspection-ledger", data);
};

export const update = (data: DeviceLedger): Promise<any> => {
	return request.put("/device/inspection-ledger", data);
};

export const remove = (ids: string): Promise<any> => {
	return request.delete(`/device/inspection-ledger/${ids}`);
};

export const inspect = (id: number): Promise<any> => {
	return request.put(`/device/inspection-ledger/${id}/inspect`, { id });
};
