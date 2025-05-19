import { del, get, post, put } from "./request";
import gameStore from "@/game-root/events/GameStore.ts";
import { IUser } from "@/api/userApi.ts";
import { IPlayer } from "@/api/playerApi.ts";

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

const worldApi = {
	// 获取某用户的所有世界
	getWorldList() {
		return get<IWorld[]>(`/world/${gameStore.get("userInfo")?.id}`);
	},

	// 创建一个新世界
	createWorld<IWorld>(world: IWorld) {
		return post("/world", { ...world, userId: gameStore.get("userInfo")?.id });
	},

	updateWorld<IWorld>(world: IWorld) {
		return put("/world", { ...world, userId: gameStore.get("userInfo")?.id });
	},

	// 删除一个世界
	deleteWorld(worldId: number) {
		return del(`/world?worldId=${worldId}&userId=${gameStore.get("userInfo")?.id}`);
	},
};

export default worldApi;
