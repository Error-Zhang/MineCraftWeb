// PlayerClient.ts
import * as signalR from "@microsoft/signalr";

export interface PlayerMoveData {
	playerId: string;
	x: number;
	y: number;
	z: number;
}

type MoveCallback = (data: PlayerMoveData) => void;

export class PlayerClient {
	private connection: signalR.HubConnection;

	constructor(hubUrl: string) {
		this.connection = new signalR.HubConnectionBuilder()
			.withUrl(hubUrl)
			.withAutomaticReconnect()
			.build();
	}

	async connect() {
		await this.connection.start();
		console.log("[PlayerClient] Connected");

		this.connection.on("ReceivePlayerMove", (data: PlayerMoveData) => {});
	}

	async disconnect() {
		await this.connection.stop();
		console.log("[PlayerClient] Disconnected");
	}

	async sendMove(data: PlayerMoveData) {
		await this.connection.invoke("PlayerMove", data);
	}

	onPlayerMove(callback: MoveCallback) {}
}
