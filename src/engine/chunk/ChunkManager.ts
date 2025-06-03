import { WorldRenderer } from "../renderer/WorldRenderer";
import { Chunk } from "./Chunk";
import { BlockEntity } from "@engine/types/block.type.ts";
import { SingleClass } from "@engine/core/Singleton.ts";
import { Coords } from "@engine/types/chunk.type.ts";
import { EdgeConfigs } from "@engine/renderer/ChunkMeshBuilder.ts";

// requestIdleCallback 兼容封装
const runIdle =
	typeof requestIdleCallback === "function"
		? (cb: IdleRequestCallback) => requestIdleCallback(cb)
		: (cb: IdleRequestCallback) =>
				setTimeout(() => cb({ timeRemaining: () => 16, didTimeout: false } as any), 1);

export class ChunkManager extends SingleClass {
	public static ChunkSize: number = 16;
	public static ChunkHeight: number = 256;
	// 半径(单位区块)
	public static ViewDistance = 6;
	public static LoadDistance = this.ViewDistance;
	public static UnloadDistance = this.LoadDistance + 2;
	// 半径(单位方块)
	public static MinUpdateDistance = this.ChunkSize;

	// 实例部分
	private chunks = new Map<string, Chunk>();
	private readonly generator: (coords: Coords) => Promise<Chunk[]>;
	private readonly worldRenderer: WorldRenderer;
	private unloadCallbacks: Array<(chunk: Chunk) => void> = [];
	private loadCallbacks: Array<(chunk: Chunk) => void> = [];
	private updatedCallbacks: Array<(isInit: boolean) => void> = [];
	private isUpdating: boolean = false;
	private isInited: boolean = true;
	private unloadTimer: number | null = null;
	private chunksToUnload: Map<string, number> = new Map(); // 存储区块key和标记时间戳
	private readonly UNLOAD_DELAY = 1000 * 60 * 5; // 60秒后卸载
	private readonly POLLING_TIME = 1000 * 10; // 每分检查一次

	constructor(generator: (coords: Coords) => Promise<Chunk[]>, worldRenderer: WorldRenderer) {
		super();
		this.generator = generator;
		this.worldRenderer = worldRenderer;
		this.onChunkLoad(chunk => {
			this.worldRenderer.buildChunk(chunk);
		});
		this.onChunkUnload(chunk => {
			this.worldRenderer.unloadChunk(chunk.Key);
		});
	}

	public static override get Instance(): ChunkManager {
		return this.getInstance();
	}

	// 静态方法：全局访问区块方块数据
	public static getBlockAt(x: number, y: number, z: number): number {
		return this.Instance.getBlock(x, y, z);
	}

	public static setBlockAt(
		x: number,
		y: number,
		z: number,
		blockId: number,
		isModel = false
	): void {
		if (isModel) {
			this.Instance.setModelBlock(x, y, z, blockId);
		} else {
			this.Instance.setBlock(x, y, z, blockId);
		}
	}

	public getEnvironment(x: number, z: number) {
		const [chunkX, chunkZ, localX, localZ] = this.worldToChunk(x, z);
		const chunk = this.getChunk(chunkX, chunkZ);
		return chunk?.getEnvironment(x, z) || -1;
	}

	public onChunkLoad(callback: (chunk: Chunk) => void) {
		this.loadCallbacks.push(callback);
	}

	public onChunkUnload(callback: (chunk: Chunk) => void) {
		this.unloadCallbacks.push(callback);
	}

	public async updateChunksAround(x: number, z: number) {
		await this.withUpdateLock(async () => {
			const start = performance.now();
			try {
				console.log("[VoxelEngine] chunk updating");
				const [chunkX, chunkZ] = this.worldToChunk(x, z);

				const minX = chunkX - ChunkManager.LoadDistance;
				const maxX = chunkX + ChunkManager.LoadDistance;
				const minZ = chunkZ - ChunkManager.LoadDistance;
				const maxZ = chunkZ + ChunkManager.LoadDistance;

				// 卸载超出范围的区块
				for (const key of this.chunks.keys()) {
					const [cx, cz] = key.split(",").map(Number);
					const dist = this.getChunkDistance(cx, cz, chunkX, chunkZ);
					const chunk = this.getChunk(cx, cz)!;
					chunk.isVisible = dist <= ChunkManager.ViewDistance;
					if (dist > ChunkManager.UnloadDistance * 2) {
						this.unloadChunk(chunk);
					} else if (dist > ChunkManager.UnloadDistance) {
						this.scheduleUnloadChunk(chunk);
					} else {
						this.cancelScheduledUnload(chunk);
					}
				}

				// 收集需要加载的区块坐标
				const coordsToLoad: Coords = [];
				for (let cz = minZ; cz <= maxZ; cz++) {
					for (let cx = minX; cx <= maxX; cx++) {
						const key = this.chunkKey(cx, cz);
						if (!this.chunks.has(key)) {
							coordsToLoad.push({ x: cx, z: cz });
						}
					}
				}

				// 批量生成区块
				if (coordsToLoad.length) {
					const chunks = await this.generator(coordsToLoad);
					for (const chunk of chunks) {
						this.chunks.set(chunk.Key, chunk);
					}
				}

				const chunks = Array.from(this.chunks.values());

				// 按距离排序
				chunks.sort((a, b) => {
					const distA = this.getChunkCenterDistance(a.position.x, a.position.z, chunkX, chunkZ);
					const distB = this.getChunkCenterDistance(b.position.x, b.position.z, chunkX, chunkZ);
					return distA - distB;
				});

				// 使用 Promise 包装 requestIdleCallback
				await new Promise<void>(resolve => {
					let currentIndex = 0;

					// 如果不等待idle全部完成就进行下次渲染会产生一些不可预测的行为 比如:重叠面
					const processChunksIdle = () => {
						runIdle(deadline => {
							while (deadline.timeRemaining() > 0 && currentIndex < chunks.length) {
								const chunk = chunks[currentIndex++];
								this.execCallback(chunk, this.loadCallbacks);
							}

							if (currentIndex < chunks.length) {
								runIdle(processChunksIdle);
							} else {
								resolve();
							}
						});
					};

					processChunksIdle();
				});
			} catch (error) {
				console.error("[VoxelEngine] Error updating chunks:", error);
			} finally {
				this.updatedCallbacks.forEach(callback => callback(this.isInited));
				this.updateChunkEdges();
				this.isInited = false;
				const end = performance.now();
				console.log(`[VoxelEngine] 区块更新完成，处理耗时: ${(end - start).toFixed(2)} ms`);
			}
		});
	}

	public onUpdated(callback: (isInit: boolean) => void) {
		this.updatedCallbacks.push(callback);
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
		return chunk?.getBlock(localX, y, localZ) ?? -1;
	}

	public setBlock(x: number, y: number, z: number, blockId: number) {
		const [chunkX, chunkZ, localX, localZ] = this.worldToChunk(x, z);
		const chunk = this.getChunk(chunkX, chunkZ);
		if (chunk) {
			chunk.setBlock(localX, y, localZ, blockId);
			this.worldRenderer.updateChunks({ x, y, z });
		}
	}

	public setModelBlock(x: number, y: number, z: number, blockId: number) {
		const [chunkX, chunkZ, localX, localZ] = this.worldToChunk(x, z);
		const chunk = this.getChunk(chunkX, chunkZ);
		if (chunk) {
			chunk.setBlock(localX, y, localZ, blockId);
			const renderer = this.worldRenderer.getRenderer(chunk.Key)!;
			let key = `${x},${y},${z}`;
			if (blockId !== 0) {
				renderer.addModelBlock(key, blockId);
			} else {
				renderer.removeModelBlock(key);
			}
		}
	}

	public loadChunk(chunkX: number, chunkZ: number) {
		const key = this.chunkKey(chunkX, chunkZ);
		const chunk = this.chunks.get(key)!;
		this.execCallback(chunk, this.loadCallbacks);
	}

	public cancelScheduledUnload(chunk: Chunk) {
		this.chunksToUnload.delete(chunk.Key);
	}

	public scheduleUnloadChunk(chunk: Chunk) {
		this.chunksToUnload.set(chunk.Key, Date.now());

		// 如果已经有定时器在运行，就不需要创建新的
		if (this.unloadTimer !== null) return;

		this.unloadTimer = setInterval(() => {
			this.withUpdateLock(async () => {
				const now = Date.now();
				let count = 0;
				// 卸载所有标记时间超过阈值的区块
				for (const [key, timestamp] of this.chunksToUnload) {
					if (now - timestamp >= this.UNLOAD_DELAY) {
						const chunk = this.chunks.get(key);
						if (chunk) {
							count++;
							this.unloadChunk(chunk);
						}
						this.chunksToUnload.delete(key);
					}
				}
				if (count) console.log(`[VoxelEngine] 区块卸载:${count}`);
			});
		}, this.POLLING_TIME);
	}

	public unloadChunk(chunk: Chunk) {
		this.execCallback(chunk, this.unloadCallbacks);
		this.chunks.delete(chunk.Key);
	}

	public forEachChunk(callback: (chunk: Chunk) => void) {
		for (const chunk of this.chunks.values()) {
			callback(chunk);
		}
	}

	public forEachBlockEntity(callback: (entity: BlockEntity, chunk: Chunk) => void) {
		for (const chunk of this.chunks.values()) {
			for (const key in chunk.blockEntities) {
				callback(chunk.blockEntities[key], chunk);
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
				return y + 1;
			}
		}
		return 0;
	}

	dispose(): void {
		clearInterval(this.unloadTimer!);
		this.chunks.clear();
	}

	/**
	 * 计算区块中心点的世界坐标
	 */
	public getChunkCenter(chunkX: number, chunkZ: number): [number, number] {
		const centerX = chunkX * ChunkManager.ChunkSize + ChunkManager.ChunkSize / 2;
		const centerZ = chunkZ * ChunkManager.ChunkSize + ChunkManager.ChunkSize / 2;
		return [centerX, centerZ];
	}

	/**
	 * 计算区块到指定区块位置中心点的距离(横向)
	 */
	public getChunkDistance(
		chunkX: number,
		chunkZ: number,
		worldChunkX: number,
		worldChunkZ: number
	): number {
		const [chunkCenterX, chunkCenterZ] = this.getChunkCenter(chunkX, chunkZ);
		const [worldCenterX, worldCenterZ] = this.getChunkCenter(worldChunkX, worldChunkZ);

		const dx = chunkCenterX - worldCenterX;
		const dz = chunkCenterZ - worldCenterZ;
		return Math.max(Math.abs(dx), Math.abs(dz)) / ChunkManager.ChunkSize;
	}

	public getChunkCenterDistance(
		chunkX: number,
		chunkZ: number,
		worldChunkX: number,
		worldChunkZ: number
	): number {
		const [chunkCenterX, chunkCenterZ] = this.getChunkCenter(chunkX, chunkZ);
		const [worldCenterX, worldCenterZ] = this.getChunkCenter(worldChunkX, worldChunkZ);

		const dx = chunkCenterX - worldCenterX;
		const dz = chunkCenterZ - worldCenterZ;
		return Math.sqrt(dx * dx + dz * dz) / ChunkManager.ChunkSize;
	}

	// 异步锁
	private async withUpdateLock<T>(callback: () => Promise<T>): Promise<T | undefined> {
		if (this.isUpdating) return;
		this.isUpdating = true;
		try {
			return await callback();
		} finally {
			this.isUpdating = false;
		}
	}

	private updateChunkEdges() {
		Array.from(this.chunks.values()).forEach((chunk: Chunk) => {
			const { x, z } = chunk.position;
			chunk.edges.clear();

			for (const { dx, dz, edge } of EdgeConfigs) {
				const neighbor = this.getChunk(x + dx, z + dz);
				if (!neighbor) chunk.edges.add(edge);
			}
		});
	}

	private execCallback(chunk: Chunk, callbacks: Function[]) {
		for (const callback of callbacks) {
			callback(chunk);
		}
	}

	private chunkKey(x: number, z: number): string {
		return `${x},${z}`;
	}
}
