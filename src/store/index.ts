import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PlayerStore, UserStore, WorldStore } from "@/store/interface.ts";


export const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			userId: 0,
			username: "",
			reset: () => set({ userId: 0, username: "" }),
		}),
		{
			name: "user-storage", 
			storage: createJSONStorage(() => sessionStorage),
		}
	)
);

export const usePlayerStore = create<PlayerStore>(set => ({
	playerId: 0,
	position: { x: -112, y: 0, z: -112 },
	reset: () => set({ playerId: 0, position: { x: -112, y: 0, z: -112 } }),
}));

export const useWorldStore = create<WorldStore>(set => ({
	worldId: 0,
	gameMode: 0,
	worldController: null,
	reset: () => set({ worldId: 0, gameMode: 0, worldController: null }),
}));
