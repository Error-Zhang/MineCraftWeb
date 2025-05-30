import { WorldRenderer } from "../renderer/WorldRenderer";
import { Chunk } from "./Chunk";
import { BlockEntity } from "@engine/types/block.type.ts";
import { SingleClass } from "@engine/core/Singleton.ts";
import { Coords } from "@engine/types/chunk.type.ts";
import { sleep } from "@/game-root/utils/lodash.ts";

export class ChunkManager extends SingleClass {
	public static ChunkSize: number = 16;
	public static ChunkHeight: number = 256;
	public static CONCURRENCY_LIMIT: number = 1;
	// 半径(单位区块)
	public static ViewDistance = 8;
	public static LoadDistance = this.ViewDistance;
	public static UnloadDistance = this.LoadDistance + 2;
	// 半径(单位方块)
	public static MinUpdateDistance = Math.max(this.ViewDistance / 2, 1) * this.ChunkSize;

	// 实例部分
	private chunks = new Map<string, Chunk>();
	private readonly generator: (coords: Coords) => Promise<Chunk[]>;
	private readonly worldRenderer: WorldRenderer;
	private unloadCallbacks: Array<(chunk: Chunk) => void> = [];
	private loadCallbacks: Array<(chunk: Chunk) => void> = [];
	private updatedCallbacks: Array<(isInit: boolean) => void> = [];
	private isUpdating: boolean = false;
	private isInited: boolean = true;

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

	public onChunkLoad(callback: (chunk: Chunk) => void) {
		this.loadCallbacks.push(callback);
	}

	public onChunkUnload(callback: (chunk: Chunk) => void) {
		this.unloadCallbacks.push(callback);
	}

	public async updateChunksAround(x: number, z: number) {
		if (this.isUpdating) return;
		this.isUpdating = true;

		try {
			console.log("[VoxelEngine] chunk update");
			const [chunkX, chunkZ] = this.worldToChunk(x, z);

			const minX = chunkX - ChunkManager.LoadDistance;
			const maxX = chunkX + ChunkManager.LoadDistance;
			const minZ = chunkZ - ChunkManager.LoadDistance;
			const maxZ = chunkZ + ChunkManager.LoadDistance;

			// 卸载超出范围的区块
			for (const key of this.chunks.keys()) {
				const [cx, cz] = key.split(",").map(Number);
				const dist = this.getChunkDistance(cx, cz, x, z);
				this.getChunk(cx, cz)?.setIsVisible(dist <= ChunkManager.ViewDistance);
				if (dist > ChunkManager.UnloadDistance) {
					this.unloadChunk(cx, cz);
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

			// 并发渲染区块，控制并发数和帧率
			const chunks = Array.from(this.chunks.values());

			// 根据到玩家位置的距离对区块进行排序
			chunks.sort((a, b) => {
				const distA = this.getChunkDistance(a.position.x, a.position.z, x, z);
				const distB = this.getChunkDistance(b.position.x, b.position.z, x, z);
				return distA - distB;
			});

			// 分批处理区块，每帧处理一部分
			const processChunks = async (startIndex: number) => {
				const endIndex = Math.min(startIndex + ChunkManager.CONCURRENCY_LIMIT, chunks.length);
				const batch = chunks.slice(startIndex, endIndex);

				await Promise.all(
					batch.map(
						chunk =>
							new Promise<void>(resolve => {
								this.execCallback(chunk, this.loadCallbacks);
								resolve();
							})
					)
				);
				// 让CPU休息一会
				await sleep(50);

				// 如果还有区块需要处理，在下一帧继续
				if (endIndex < chunks.length) {
					requestAnimationFrame(() => processChunks(endIndex));
				} else {
					// 所有区块渲染完成后，统一更新边缘
					for (const chunk of chunks) {
						this.updateChunkEdges(chunk);
					}
				}
			};

			// 开始处理第一批区块
			processChunks(0);
		} finally {
			this.updatedCallbacks.forEach(callback => callback(this.isInited));
			this.isUpdating = false;
			this.isInited = false;
		}
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
		this.chunks.clear();
	}

	private updateChunkEdges(chunk: Chunk) {
		let chunkX = chunk.position.x;
		let chunkZ = chunk.position.z;
		if (!chunk) return;

		const edges: number[] = [];

		// 检查 x- 边界
		const leftChunk = this.getChunk(chunkX - 1, chunkZ);
		if (!leftChunk) edges.push(0);

		// 检查 x+ 边界
		const rightChunk = this.getChunk(chunkX + 1, chunkZ);
		if (!rightChunk) edges.push(1);

		// 检查 z- 边界
		const backChunk = this.getChunk(chunkX, chunkZ - 1);
		if (!backChunk) edges.push(2);

		// 检查 z+ 边界
		const frontChunk = this.getChunk(chunkX, chunkZ + 1);
		if (!frontChunk) edges.push(3);

		// 更新当前区块的边界状态
		chunk.edges = edges;

		// 更新相邻区块的边界状态
		if (leftChunk) {
			leftChunk.edges = leftChunk.edges.filter(e => e !== 1);
			if (!this.getChunk(chunkX - 2, chunkZ)) leftChunk.edges.push(0);
		}
		if (rightChunk) {
			rightChunk.edges = rightChunk.edges.filter(e => e !== 0);
			if (!this.getChunk(chunkX + 2, chunkZ)) rightChunk.edges.push(1);
		}
		if (backChunk) {
			backChunk.edges = backChunk.edges.filter(e => e !== 3);
			if (!this.getChunk(chunkX, chunkZ - 2)) backChunk.edges.push(2);
		}
		if (frontChunk) {
			frontChunk.edges = frontChunk.edges.filter(e => e !== 2);
			if (!this.getChunk(chunkX, chunkZ + 2)) frontChunk.edges.push(3);
		}
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
