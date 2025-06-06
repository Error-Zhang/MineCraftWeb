import { WorldController } from "@engine/core/WorldController.ts";
import { BlockRegistry } from "@engine/block/BlockRegistry.ts";

export interface UserStore {
	userId: number;
	username: string;
	reset: () => void;
}

export interface GameStore {
	isGaming: boolean;
	gameMode: number;
	isSplitting: boolean;
}

export interface PlayerStore {
	origin: { x: number; z: number };
	playerId: number;
	holdBlockId: number;
	setOrigin: (x: number, z: number) => void;
	reset: () => void;
}

export interface WorldStore {
	worldId: number;
	worldController: WorldController | null;
	reset: () => void;
}

export interface BlockStore {
	blockRegistry: BlockRegistry | null;
}
