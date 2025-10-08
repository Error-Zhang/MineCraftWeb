import * as signalR from "@microsoft/signalr";
import { ApiResponse } from "@/game-root/client/interface.ts";

export interface IAnimalSpawnData {
	animalId: number;
	worldId: number;
	type: string;
	x: number;
	y: number;
	z: number;
}

export interface IAnimalBehaviorEvent {
	animalId: number;
	worldId: number;
	behaviorType: string;
	targetX: number;
	targetY: number;
	targetZ: number;
	randomSeed: number;
}

export interface IAnimalPositionSync {
	animalId: number;
	x: number;
	y: number;
	z: number;
}

export class AnimalClient {
	private connection: signalR.HubConnection;

	constructor(hubUrl: string) {
		this.connection = new signalR.HubConnectionBuilder()
			.withUrl(hubUrl)
			.withAutomaticReconnect()
			.build();
	}

	async connect() {
		await this.connection.start();
		console.log("[AnimalClient] Connected");
	}

	async disconnect() {
		await this.connection.stop();
	}

	async joinWorld(worldId: number) {
		const res = await this.connection.invoke<ApiResponse<null>>("JoinWorld", worldId);
		if (res.code !== 200) throw new Error("加入动物世界失败:" + res.message);
	}

	/**
	 * 获取指定区块的动物列表
	 */
	async getChunkAnimals(
		chunkX: number,
		chunkZ: number
	): Promise<{ animals: IAnimalSpawnData[]; isOwner: boolean }> {
		return await this.connection.invoke<{
			animals: IAnimalSpawnData[];
			isOwner: boolean;
		}>("GetChunkAnimals", chunkX, chunkZ);
	}

	/**
	 * 广播动物行为事件
	 */
	async broadcastBehavior(
		animalId: number,
		behaviorType: string,
		targetX: number,
		targetY: number,
		targetZ: number,
		randomSeed: number
	) {
		const event: IAnimalBehaviorEvent = {
			animalId,
			worldId: 0, // 服务器会填充
			behaviorType,
			targetX,
			targetY,
			targetZ,
			randomSeed,
		};
		await this.connection.invoke("BroadcastAnimalBehavior", event);
	}

	/**
	 * 同步动物位置
	 */
	async syncPosition(animalId: number, x: number, y: number, z: number) {
		const sync: IAnimalPositionSync = { animalId, x, y, z };
		await this.connection.invoke("SyncAnimalPosition", sync);
	}

	/**
	 * 批量同步动物位置
	 */
	async syncPositions(positions: IAnimalPositionSync[]) {
		await this.connection.invoke("SyncAnimalPositions", positions);
	}

	/**
	 * 监听动物行为事件
	 */
	onAnimalBehavior(cb: (event: IAnimalBehaviorEvent) => void) {
		this.connection.on("OnAnimalBehavior", (event: IAnimalBehaviorEvent) => {
			try {
				cb(event);
			} catch (e) {
				console.error("[AnimalClient] Error handling behavior event:", e);
			}
		});
	}

	/**
	 * 监听动物位置同步
	 */
	onAnimalPositionSync(cb: (sync: IAnimalPositionSync) => void) {
		this.connection.on("OnAnimalPositionSync", (sync: IAnimalPositionSync) => {
			try {
				cb(sync);
			} catch (e) {
				console.error("[AnimalClient] Error handling position sync:", e);
			}
		});
	}

	/**
	 * 监听批量位置同步
	 */
	onAnimalPositionsSync(cb: (syncs: IAnimalPositionSync[]) => void) {
		this.connection.on("OnAnimalPositionsSync", (syncs: IAnimalPositionSync[]) => {
			try {
				cb(syncs);
			} catch (e) {
				console.error("[AnimalClient] Error handling positions sync:", e);
			}
		});
	}
}
