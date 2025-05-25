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

export interface IBlockType {
	blockType: string;
	blockId: number;
}
