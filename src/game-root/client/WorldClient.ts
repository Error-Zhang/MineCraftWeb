// WorldClient.ts
import * as signalR from "@microsoft/signalr";

export interface ChunkRequest {
	chunkX: number;
	chunkZ: number;
}

export interface ChunkData {
	chunkX: number;
	chunkZ: number;
	blocks: number[][][]; // 举例结构
}

export class WorldClient {
	private connection: signalR.HubConnection;

	constructor(hubUrl: string) {
		this.connection = new signalR.HubConnectionBuilder()
			.withUrl(hubUrl)
			.withAutomaticReconnect()
			.build();
	}

	async connect() {
		await this.connection.start();
		console.log("[WorldClient] Connected");

		this.connection.on("ReceiveChunk", (data: ChunkData) => {});
	}

	async disconnect() {
		await this.connection.stop();
		console.log("[WorldClient] Disconnected");
	}

	async requestChunk(req: ChunkRequest) {
		await this.connection.invoke("RequestChunk", req);
	}
}
