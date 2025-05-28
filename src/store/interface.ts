import { WorldController } from "@engine/core/WorldController.ts";
import { BlockRegistry } from "@engine/block/BlockRegistry.ts";
import { IBlockReflect } from "@/api/interface.ts";

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
	playerId: number;
	position: { x: number; y: number; z: number };
	holdBlockId: number;
	move: (x: number, y: number, z: number) => void;
	reset: () => void;
}

export interface WorldStore {
	worldId: number;
	worldController: WorldController | null;
	reset: () => void;
}

export interface BlockStore {
	blockTypes: IBlockReflect;
	blockRegistry: BlockRegistry | null;
	transformBlockId: (blockId: number, to: "local" | "cloud") => number;
}
