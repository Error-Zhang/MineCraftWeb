import { WorldRenderer } from "../renderer/WorldRenderer";
import { Chunk } from "./Chunk";
import { BlockEntity } from "@engine/types/block.type.ts";

export class ChunkManager {
	public static ChunkSize: number = 16;
	public static ChunkHeight: number = 128;

	// 单位(区块)
	public static ViewDistance = 4;
	public static LoadDistance = this.ViewDistance + 1;
	public static UnloadDistance = this.LoadDistance + 2;
	// 单位(方块)
	public static MinUpdateDistance = Math.max(this.ViewDistance - 1, 1) * this.ChunkSize;

	private static _instance: ChunkManager;
	// 实例部分
	private chunks = new Map<string, Chunk>();
	private readonly generator: (x: number, z: number) => Promise<Chunk>;
	private readonly worldRenderer: WorldRenderer;
	private unloadCallbacks: Array<(chunk: Chunk) => void> = [];
	private loadCallbacks: Array<(chunk: Chunk) => void> = [];

	private constructor(
		generator: (x: number, z: number) => Promise<Chunk>,
		worldRenderer: WorldRenderer
	) {
		this.generator = generator;
		this.worldRenderer = worldRenderer;
		this.onChunkLoad(chunk => {
			this.worldRenderer.buildChunk(chunk);
		});
		this.onChunkUnload(chunk => {
			this.worldRenderer.unloadChunk(chunk.Key);
		});
	}

	public static get Instance(): ChunkManager {
		if (!this._instance) {
			throw new Error("ChunkManager is not initialized.");
		}
		return this._instance;
	}

	public static create(
		generator: (x: number, z: number) => Promise<Chunk>,
		worldRenderer: WorldRenderer
	) {
		if (this._instance) {
			throw new Error("ChunkManager has already been initialized.");
		}
		this._instance = new ChunkManager(generator, worldRenderer);
		return this._instance;
	}

	// 静态方法：全局访问区块方块数据
	public static getBlockAt(x: number, y: number, z: number): number {
		return this.Instance.getBlock(x, y, z);
	}

	public static setBlockAt(x: number, y: number, z: number, blockId: number): void {
		this.Instance.setBlock(x, y, z, blockId);
	}

	public onChunkLoad(callback: (chunk: Chunk) => void) {
		this.loadCallbacks.push(callback);
	}

	public onChunkUnload(callback: (chunk: Chunk) => void) {
		this.unloadCallbacks.push(callback);
	}

	public async updateChunksAround(x: number, z: number) {
		const chunkX = Math.floor(x / ChunkManager.ChunkSize);
		const chunkZ = Math.floor(z / ChunkManager.ChunkSize);

		// 计算需要保留的区块范围
		const minX = chunkX - ChunkManager.LoadDistance;
		const maxX = chunkX + ChunkManager.LoadDistance;
		const minZ = chunkZ - ChunkManager.LoadDistance;
		const maxZ = chunkZ + ChunkManager.LoadDistance;

		// 先卸载超出范围的区块
		for (const key of this.chunks.keys()) {
			const [cx, cz] = key.split(",").map(Number);
			const dist = this.getChunkDistance(cx, cz, x, z);
			// 更新可见性
			const chunk = this.chunks.get(key)!;
			chunk.isVisible = dist <= ChunkManager.ViewDistance;
			// 如果区块在保留范围外，则卸载
			if (dist > ChunkManager.UnloadDistance) {
				this.unloadChunk(cx, cz);
			}
		}

		// 收集需要加载的区块
		const loadPromises: Promise<void>[] = [];
		for (let cz = minZ; cz <= maxZ; cz++) {
			for (let cx = minX; cx <= maxX; cx++) {
				const key = this.chunkKey(cx, cz);
				const dist = this.getChunkDistance(cx, cz, x, z);
				// 如果区块不存在，创建加载Promise
				if (!this.chunks.has(key)) {
					const loadPromise = (async () => {
						const chunk = await this.generator(cx, cz);
						chunk.isVisible = dist <= ChunkManager.ViewDistance;
						this.chunks.set(key, chunk);
					})();
					loadPromises.push(loadPromise);
				}
			}
		}
		// 并发加载所有区块
		await Promise.all(loadPromises);

		this.forEachChunk(chunk => {
			this.execCallback(chunk, this.loadCallbacks);
		});
	}

	public getChunk(chunkX: number, chunkZ: number) {
		return this.chunks.get(this.chunkKey(chunkX, chunkZ));
	}

	public worldToChunk(x: number, z: number): [number, number, number, number] {
		const chunkX = Math.floor(x / ChunkManager.ChunkSize);
		const chunkZ = Math.floor(z / ChunkManager.ChunkSize);
		const localX = x - chunkX * ChunkManager.ChunkSize;
		const localZ = z - chunkZ * ChunkManager.ChunkSize;
		return [chunkX, chunkZ, localX, localZ];
	}

	public getBlock(x: number, y: number, z: number): number {
		const [chunkX, chunkZ, localX, localZ] = this.worldToChunk(x, z);
		const chunk = this.getChunk(chunkX, chunkZ);
		return chunk?.getBlock(localX, y, localZ) ?? 0;
	}

	public setBlock(x: number, y: number, z: number, blockId: number) {
		const [chunkX, chunkZ, localX, localZ] = this.worldToChunk(x, z);
		const chunk = this.getChunk(chunkX, chunkZ);
		if (chunk) {
			chunk.setBlock(localX, y, localZ, blockId);
			this.worldRenderer.updateChunks({ x, y, z });
		}
	}

	public loadChunk(chunkX: number, chunkZ: number) {
		const key = this.chunkKey(chunkX, chunkZ);
		const chunk = this.chunks.get(key)!;
		this.execCallback(chunk, this.loadCallbacks);
	}

	public unloadChunk(chunkX: number, chunkZ: number) {
		const key = this.chunkKey(chunkX, chunkZ);
		const chunk = this.chunks.get(key)!;
		this.execCallback(chunk, this.unloadCallbacks);
		this.chunks.delete(key);
	}

	public forEachChunk(callback: (chunk: Chunk) => void) {
		for (const chunk of this.chunks.values()) {
			callback(chunk);
		}
	}

	public forEachBlockEntity(callback: (entity: BlockEntity, chunk: Chunk) => void) {
		for (const chunk of this.chunks.values()) {
			for (const entity of chunk.blockEntities.values()) {
				callback(entity, chunk);
			}
		}
	}

	public getChunkByKey(key: string) {
		return this.chunks.get(key);
	}

	public getColumnHeight(x: number, z: number): number {
		const [chunkX, chunkZ, localX, localZ] = this.worldToChunk(x, z);
		const chunk = this.getChunk(chunkX, chunkZ);
		if (!chunk) return 0;

		for (let y = ChunkManager.ChunkHeight - 1; y > 0; y--) {
			const blockId = chunk.getBlock(localX, y, localZ);
			if (blockId !== 0) {
				return y;
			}
		}
		return 0;
	}

	dispose(): void {
		this.chunks.clear();
	}

	private execCallback(chunk: Chunk, callbacks: Function[]) {
		for (const callback of callbacks) {
			callback(chunk);
		}
	}

	private chunkKey(x: number, z: number): string {
		return `${x},${z}`;
	}

	/**
	 * 计算区块中心点的世界坐标
	 */
	private getChunkCenter(chunkX: number, chunkZ: number): [number, number] {
		const centerX = chunkX * ChunkManager.ChunkSize + ChunkManager.ChunkSize / 2;
		const centerZ = chunkZ * ChunkManager.ChunkSize + ChunkManager.ChunkSize / 2;
		return [centerX, centerZ];
	}

	/**
	 * 计算区块到指定位置的距离（以区块为单位）
	 */
	private getChunkDistance(chunkX: number, chunkZ: number, worldX: number, worldZ: number): number {
		const [centerX, centerZ] = this.getChunkCenter(chunkX, chunkZ);
		const dx = centerX - worldX;
		const dz = centerZ - worldZ;
		return Math.max(Math.abs(dx), Math.abs(dz)) / ChunkManager.ChunkSize;
	}
}
