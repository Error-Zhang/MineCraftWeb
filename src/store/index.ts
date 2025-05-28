import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BlockStore, GameStore, PlayerStore, UserStore, WorldStore } from "./interface.ts";

export const useUserStore = create<UserStore>()(
	persist(
		set => ({
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

export const useGameStore = create<GameStore>(set => ({
	gameMode: 0,
	isGaming: false,
	isSplitting: false,
}));

export const usePlayerStore = create<PlayerStore>((set, get) => ({
	playerId: 0,
	position: { x: -112, y: 0, z: -112 },
	holdBlockId: 0,
	move: (x, y, z) => {
		const pos = get().position;
		return set({ position: { x: pos.x + x, y: pos.y + y, z: pos.z + z } });
	},
	reset: () => set({ playerId: 0, holdBlockId: 0, position: { x: -112, y: 0, z: -112 } }),
}));

export const useWorldStore = create<WorldStore>(set => ({
	worldId: 0,
	worldController: null,
	reset: () => set({ worldId: 0, worldController: null }),
}));

export const useBlockStore = create<BlockStore>((set, get) => ({
	blockTypes: {
		byId: {},
		byName: {},
	},
	blockRegistry: null,
	transformBlockId: (blockId: number, to: "local" | "cloud") => {
		if (!blockId) return 0;
		const { blockTypes, blockRegistry } = get();

		if (!blockRegistry) {
			throw new Error("BlockRegistry not initialized");
		}

		if (to === "local") {
			const name = blockTypes.byId[blockId];
			if (!name) throw new Error(`Cloud block ID ${blockId} not found in blockReflect.byId`);
			return blockRegistry.getByName(name).id!;
		} else {
			const def = blockRegistry.getById(blockId);
			const cloudId = blockTypes.byName[def.blockType];
			if (cloudId === undefined)
				throw new Error(`Block name ${def.blockType} not found in blockReflect.byName`);
			return cloudId;
		}
	},
}));
