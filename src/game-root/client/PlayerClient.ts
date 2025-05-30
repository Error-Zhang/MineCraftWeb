// PlayerClient.ts
import * as signalR from "@microsoft/signalr";
import { ApiResponse, IBlockActionData, IPlayerMoveData } from "@/game-root/client/interface.ts";
import { WorldClient } from "@/game-root/client/WorldClient.ts";

export class PlayerClient {
	private connection: signalR.HubConnection;
	private worldClient!: WorldClient;

	constructor(hubUrl: string) {
		this.connection = new signalR.HubConnectionBuilder()
			.withUrl(hubUrl)
			.withAutomaticReconnect()
			.build();
	}

	bindWorldClient(worldClient: WorldClient) {
		this.worldClient = worldClient;
	}

	async connect() {
		await this.connection.start();
		console.log("[PlayerClient] Connected");
	}

	async disconnect() {
		await this.connection.stop();
		console.log("[PlayerClient] Disconnected");
	}

	async sendPlayerMove(data: IPlayerMoveData) {
		await this.connection.invoke("PlayerMove", data);
	}

	async sendPlaceBlock(position: { x: number; y: number; z: number }, blockId: number) {
		const { x, y, z } = position;
		let data: IBlockActionData = { x, y, z, blockId }; // 不要使用剩余参数赋值，如果传入的是Vector会出错
		await this.worldClient.setBlock(data);
		await this.connection.invoke("PlaceBlock", data);
	}

	onPlayerMove(callback: (data: IPlayerMoveData) => void) {
		this.connection.on("PlayerMove", callback);
	}

	onPlaceBlock(callback: (data: IBlockActionData) => void) {
		this.connection.on("PlaceBlock", callback);
	}

	onPlayerJoined(callback: (playerId: number) => void) {
		this.connection.on("PlayerJoined", callback);
	}

	onPlayerLeave(callback: (playerId: number) => void) {
		this.connection.on("PlayerLeave", callback);
	}

	async joinWorld(worldId: number, playerId: number) {
		const response = await this.connection.invoke<ApiResponse<any>>("JoinWorld", worldId, playerId);
		if (response.code !== 200) {
			throw new Error(`Can't join player because ${response.message}`);
		}
	}
}
