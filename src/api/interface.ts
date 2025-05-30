export interface IUser {
	id?: number;
	userName: string;
	passWord: string;
}

export interface IPlayer {
	id: number;
	playerName: string;
	sex: number;
	createdAt: string;
	worldId: number;
	userId: number;
	user: IUser;
}

export interface IWorld {
	id?: number;
	userId?: number;
	worldName: string;
	seed: string;
	gameMode: number;
	worldMode: number;
	season: number;
	isPublic: number;
	user?: IUser;
	players?: IPlayer[];
	createdAt?: string;
}

export interface IBlockReflect {
	byId: Record<number, string>;
	byName: Record<string, number>;
}

export interface IChunkData {
	x: number;
	z: number;
	cells: number[]; // 长度 = chunkSize * chunkSize * chunkHeight
	shafts: Record<string, ChunkShaftData>; // key 为 "x,z"
}

export interface ChunkShaftData {
	top: number; // 最顶部非空气方块的 y 值
	humidity: number; // 湿度值
	temperature: number; // 温度值
}
