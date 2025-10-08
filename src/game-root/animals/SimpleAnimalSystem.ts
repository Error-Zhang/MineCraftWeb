import { Scene, Vector3 } from "@babylonjs/core";
import { SimpleAnimalEntity } from "./SimpleAnimalEntity";
import { IAnimalSpawnData } from "@/game-root/client/AnimalClient.ts";
import { useWorldStore } from "@/store";
import { IChunkSetting } from "@/game-root/client/interface.ts";

/**
 * 区块动物管理
 */
interface ChunkAnimalData {
	chunkX: number;
	chunkZ: number;
	animals: SimpleAnimalEntity[];
	isOwned: boolean; // 是否由本客户端控制
}

/**
 * 简化的动物系统
 * 基于区块的生成和管理
 */
export class SimpleAnimalSystem {
	private scene: Scene;
	private animals = new Map<number, SimpleAnimalEntity>();
	private chunkAnimals = new Map<string, ChunkAnimalData>();
	private currentPlayerChunk: { x: number; z: number } | null = null;

	// 回调函数
	private onRequestChunkAnimals?: (
		chunkX: number,
		chunkZ: number
	) => Promise<{
		animals: IAnimalSpawnData[];
		isOwner: boolean;
	}>;
	private onBroadcastBehavior?: (
		animalId: number,
		behaviorType: string,
		target: Vector3,
		seed: number
	) => void;
	private onSyncPositions?: (
		positions: Array<{ animalId: number; x: number; y: number; z: number }>
	) => void;

	// 同步定时器
	private lastSyncTime = 0;
	private readonly SYNC_INTERVAL = 200; // 每2秒同步一次位置

	// 视距配置
	private readonly CHUNK_LOAD_RADIUS = 3; // 加载半径（区块）
	private readonly CHUNK_UNLOAD_RADIUS = 5; // 卸载半径（区块）
	private chunkSetting: IChunkSetting;

	constructor(
		scene: Scene,
		callbacks: {
			onRequestChunkAnimals?: (
				chunkX: number,
				chunkZ: number
			) => Promise<{
				animals: IAnimalSpawnData[];
				isOwner: boolean;
			}>;
			onBroadcastBehavior?: (
				animalId: number,
				behaviorType: string,
				target: Vector3,
				seed: number
			) => void;
			onSyncPositions?: (
				positions: Array<{ animalId: number; x: number; y: number; z: number }>
			) => void;
		}
	) {
		this.scene = scene;
		this.onRequestChunkAnimals = callbacks.onRequestChunkAnimals;
		this.onBroadcastBehavior = callbacks.onBroadcastBehavior;
		this.onSyncPositions = callbacks.onSyncPositions;

		this.chunkSetting = useWorldStore.getState().chunkSetting!;
	}

	/**
	 * 更新系统
	 */
	public update(deltaTime: number, playerPosition: Vector3): void {
		// 检查玩家是否进入新区块
		const playerChunkX = Math.floor(playerPosition.x / this.chunkSetting.chunkSize);
		const playerChunkZ = Math.floor(playerPosition.z / this.chunkSetting.chunkSize);

		if (
			!this.currentPlayerChunk ||
			this.currentPlayerChunk.x !== playerChunkX ||
			this.currentPlayerChunk.z !== playerChunkZ
		) {
			this.currentPlayerChunk = { x: playerChunkX, z: playerChunkZ };
			this.updateChunks(playerChunkX, playerChunkZ);
		}

		// 更新所有动物
		for (const animal of this.animals.values()) {
			animal.update(deltaTime);
		}

		// 定期同步位置
		const currentTime = Date.now();
		if (currentTime - this.lastSyncTime >= this.SYNC_INTERVAL) {
			this.syncOwnedAnimalPositions();
			this.lastSyncTime = currentTime;
		}

		// 卸载远距离动物
		this.unloadDistantAnimals(playerChunkX, playerChunkZ);
	}

	/**
	 * 处理来自网络的行为事件
	 */
	public handleBehaviorEvent(
		animalId: number,
		behaviorType: string,
		targetX: number,
		targetY: number,
		targetZ: number,
		seed: number
	): void {
		const animal = this.animals.get(animalId);
		if (animal && !animal.isOwned) {
			const target = new Vector3(targetX, targetY, targetZ);
			animal.handleBehaviorEvent(behaviorType, target, seed);
		}
	}

	/**
	 * 处理来自网络的位置同步
	 */
	public handlePositionSync(animalId: number, x: number, y: number, z: number): void {
		const animal = this.animals.get(animalId);
		if (animal && !animal.isOwned) {
			animal.syncPosition(new Vector3(x, y, z));
		}
	}

	/**
	 * 批量处理位置同步
	 */
	public handlePositionsSync(
		positions: Array<{ animalId: number; x: number; y: number; z: number }>
	): void {
		for (const pos of positions) {
			this.handlePositionSync(pos.animalId, pos.x, pos.y, pos.z);
		}
	}

	/**
	 * 触发动物行为（由拥有者调用）
	 */
	public triggerAnimalBehavior(animalId: number, behaviorType: string, target: Vector3): void {
		const animal = this.animals.get(animalId);
		if (!animal || !animal.isOwned) return;

		// 生成随机种子确保一致性
		const seed = Math.floor(Math.random() * 1000000);

		// 本地执行
		animal.handleBehaviorEvent(behaviorType, target, seed);

		// 广播给其他玩家
		if (this.onBroadcastBehavior) {
			this.onBroadcastBehavior(animalId, behaviorType, target, seed);
		}
	}

	/**
	 * 获取动物
	 */
	public getAnimal(id: number): SimpleAnimalEntity | undefined {
		return this.animals.get(id);
	}

	/**
	 * 获取所有动物
	 */
	public getAllAnimals(): SimpleAnimalEntity[] {
		return Array.from(this.animals.values());
	}

	/**
	 * 清理系统
	 */
	public dispose(): void {
		for (const animal of this.animals.values()) {
			animal.dispose();
		}
		this.animals.clear();
		this.chunkAnimals.clear();
	}

	/**
	 * 更新区块（加载新区块的动物）
	 */
	private async updateChunks(playerChunkX: number, playerChunkZ: number): Promise<void> {
		const chunksToLoad: Array<{ x: number; z: number }> = [];

		// 收集需要加载的区块
		for (let dx = -this.CHUNK_LOAD_RADIUS; dx <= this.CHUNK_LOAD_RADIUS; dx++) {
			for (let dz = -this.CHUNK_LOAD_RADIUS; dz <= this.CHUNK_LOAD_RADIUS; dz++) {
				const chunkX = playerChunkX + dx;
				const chunkZ = playerChunkZ + dz;
				const chunkKey = this.getChunkKey(chunkX, chunkZ);

				if (!this.chunkAnimals.has(chunkKey)) {
					chunksToLoad.push({ x: chunkX, z: chunkZ });
				}
			}
		}

		// 加载区块动物
		for (const chunk of chunksToLoad) {
			await this.loadChunkAnimals(chunk.x, chunk.z);
		}
	}

	/**
	 * 加载区块动物
	 */
	private async loadChunkAnimals(chunkX: number, chunkZ: number): Promise<void> {
		if (!this.onRequestChunkAnimals) return;

		const chunkKey = this.getChunkKey(chunkX, chunkZ);

		// 从服务器获取动物数据（包含所有权信息）
		const response = await this.onRequestChunkAnimals(chunkX, chunkZ);

		if (!response.animals.length) return;

		const animalDataList = response.animals;
		const isOwned = response.isOwner;

		const animals: SimpleAnimalEntity[] = [];

		for (const data of animalDataList) {
			const animal = new SimpleAnimalEntity(
				this.scene,
				data.animalId,
				data.type,
				new Vector3(data.x, data.y, data.z)
			);

			animal.isOwned = isOwned; // 设置所有权
			await animal.loadModel();

			animals.push(animal);
			this.animals.set(animal.id, animal);
		}

		this.chunkAnimals.set(chunkKey, {
			chunkX,
			chunkZ,
			animals,
			isOwned,
		});

		console.log(
			`[AnimalSystem] Loaded ${animals.length} animals for chunk (${chunkX}, ${chunkZ}), owned: ${isOwned}`
		);
	}

	/**
	 * 卸载远距离动物
	 */
	private unloadDistantAnimals(playerChunkX: number, playerChunkZ: number): void {
		const chunksToUnload: string[] = [];

		for (const [chunkKey, chunkData] of this.chunkAnimals.entries()) {
			const dx = Math.abs(chunkData.chunkX - playerChunkX);
			const dz = Math.abs(chunkData.chunkZ - playerChunkZ);
			const distance = Math.max(dx, dz);

			if (distance > this.CHUNK_UNLOAD_RADIUS) {
				chunksToUnload.push(chunkKey);
			}
		}

		for (const chunkKey of chunksToUnload) {
			this.unloadChunk(chunkKey);
		}
	}

	/**
	 * 卸载区块
	 */
	private unloadChunk(chunkKey: string): void {
		const chunkData = this.chunkAnimals.get(chunkKey);
		if (!chunkData) return;

		for (const animal of chunkData.animals) {
			animal.dispose();
			this.animals.delete(animal.id);
		}

		this.chunkAnimals.delete(chunkKey);
		console.log(`[AnimalSystem] Unloaded chunk ${chunkKey}`);
	}

	/**
	 * 同步拥有的动物位置
	 */
	private syncOwnedAnimalPositions(): void {
		if (!this.onSyncPositions) return;

		const positions: Array<{ animalId: number; x: number; y: number; z: number }> = [];

		for (const animal of this.animals.values()) {
			if (animal.isOwned) {
				const pos = animal.getPosition();
				positions.push({
					animalId: animal.id,
					x: pos.x,
					y: pos.y,
					z: pos.z,
				});
			}
		}

		if (positions.length) {
			this.onSyncPositions(positions);
		}
	}

	/**
	 * 获取区块键
	 */
	private getChunkKey(chunkX: number, chunkZ: number): string {
		return `${chunkX},${chunkZ}`;
	}
}
