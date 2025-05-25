import { WorldController } from "@engine/core/WorldController.ts";

export interface UserStore {
	userId: number;
	username: string;
	reset: () => void;
}

export interface PlayerStore {
	playerId: number;
	position: { x: number; y: number; z: number };
	reset: () => void;
}

export interface WorldStore {
	worldId: number;
	gameMode: number;
	worldController: WorldController | null;
	reset: () => void;
}
