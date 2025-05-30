export interface ApiResponse<T> {
	code: number;
	message: string;
	data: T;
}

export interface IChunkSetting {
	chunkSize: number;
	chunkHeight: number;
}

export interface IPlayerMoveData {
	playerId: number;
	x: number;
	y: number;
	z: number;
}

export interface IBlockActionData {
	playerId?: number;
	blockId: number;
	x: number;
	y: number;
	z: number;
}
