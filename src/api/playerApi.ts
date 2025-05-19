import { get, post } from "@/api/request.ts";
import { IUser } from "@/api/userApi.ts";
import gameStore from "@/game-root/events/GameStore.ts";

export interface IPlayer {
	id: number;
	playerName: string;
	sex: number;
	createdAt: string;
	worldId: number;
	userId: number;
	user: IUser;
}

const playerApi = {
	addPlayerToWorld(player: IPlayer) {
		return post("/player", player);
	},
	getPlayer(worldId: number) {
		return get<IPlayer>(`/player?worldId=${worldId}&userId=${gameStore.get("userInfo")?.id}`);
	},
	getPlayerList(worldId: number) {
		return get<IPlayer[]>(`/player/list/${worldId}`);
	},
};
export default playerApi;
