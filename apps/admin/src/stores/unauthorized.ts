import { create } from "zustand";

interface UnauthorizedState {
	open: boolean;
	show: () => void;
	hide: () => void;
}

export const useUnauthorizedStore = create<UnauthorizedState>((set) => ({
	open: false,
	show: () => set({ open: true }),
	hide: () => set({ open: false }),
}));
