import { World } from "@/game-root/world/World.ts";
import { Chunk, CHUNK_HEIGHT, CHUNK_SIZE, Position } from "@/game-root/world/Chunk.ts";
import { Scene, Vector3 } from "@babylonjs/core";
import blockFactory from "@/blocks/core/BlockFactory.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";
import createNoiseWorker from "@/game-root/noise/NoiseWorkerWrapper.ts";
import { NoiseWorker } from "@/game-root/noise/NoiseWorker.ts";
import { Remote } from "comlink";
import { GameOption } from "@/game-root/Game.ts";
import WorldSetting from "@/game-root/world/WorldSetting.ts";
import { Grid3D } from "@/game-root/noise/Grid.ts";
import { sleep } from "@/game-root/utils/lodash.ts";

class WorldGenerator {
	private readonly scene: Scene;

	private noiseWorker?: Remote<NoiseWorker>;
	private noiseWorkerReady: Promise<void>;

	private radius: number;
	private isUpdating = false;
	private center: Position;

	constructor(scene: Scene, options: GameOption) {
		this.scene = scene;
		this.radius = Math.ceil(options.visualField / CHUNK_SIZE);
		this.center = {
			x: Math.floor(options.start.x / CHUNK_SIZE),
			y: 0,
			z: Math.floor(options.start.z / CHUNK_SIZE),
		};
		const worldSetting = new WorldSetting();
		// 创建并初始化worker
		this.noiseWorkerReady = createNoiseWorker(worldSetting).then(worker => {
			this.noiseWorker = worker;
		});
	}

	public async generateWorldParallel(): Promise<World> {
		await this.noiseWorkerReady;

		const world = new World(this.scene);
		const radius = this.radius;

		const chunkCoords: { cx: number; cz: number }[] = [];
		for (let cx = -radius; cx < radius; cx++) {
			for (let cz = -radius; cz < radius; cz++) {
				chunkCoords.push({ cx: this.center.x + cx, cz: this.center.z + cz });
			}
		}

		await Promise.all(
			chunkCoords.map(({ cx, cz }) => {
				const pos = { x: cx, y: 0, z: cz };
				return this.generateChunk(world, pos);
			})
		);

		this.renderChunks(world);

		return world;
	}

	// 调用的位置加防抖
	public async updateWorldAround(
		position: Position,
		world: World,
		chunksPerFrame = 2,
		frameTime: number = 200
	) {
		if (this.isUpdating) return;
		if (!world.hasChunkChanged(position)) return;

		this.isUpdating = true;
		const loadRadius = Math.max(Math.floor(this.radius / 2), 2);

		const playerChunkPos = {
			x: Math.floor(position.x / CHUNK_SIZE),
			y: 0,
			z: Math.floor(position.z / CHUNK_SIZE),
		};

		const loadQueue: { x: number; z: number }[] = [];
		for (let dx = -loadRadius; dx <= loadRadius; dx++) {
			for (let dz = -loadRadius; dz <= loadRadius; dz++) {
				const cx = playerChunkPos.x + dx; // 根据中心坐标偏移
				const cz = playerChunkPos.z + dz; // 根据中心坐标偏移
				const pos = { x: cx, y: 0, z: cz };
				if (!world.getChunk(pos)) {
					loadQueue.push({ x: cx, z: cz });
				} else {
					world.activeChunk(pos, true);
				}
			}
		}

		let index = 0;
		let finished = 0;

		const step = async () => {
			let count = 0;
			while (index < loadQueue.length && count < chunksPerFrame) {
				const { x, z } = loadQueue[index];
				const pos = { x, y: 0, z };

				this.generateChunk(world, pos).then(chunk => {
					chunk.render();
					finished++;
					if (finished === loadQueue.length) {
						this.unloadWorldChunk(world, playerChunkPos);
						this.isUpdating = false;
						console.log(`[updateWorldAround]: Updated ${finished} Chunks`);
					}
				});
				// 通过显示等待，来降低cpu在同一时刻的并发量，防止掉帧
				await sleep(frameTime);
				index++;
				count++;
			}
			if (index < loadQueue.length) {
				requestAnimationFrame(step);
			}
		};
		if (!loadQueue.length) {
			// 如果没有任务直接释放锁
			this.isUpdating = false;
		} else {
			console.log("[updateWorldAround]: Updating");
			requestAnimationFrame(step);
		}
	}

	unloadWorldChunk(world: World, playerChunkPos: Position) {
		const unloadRadius = this.radius;
		// 卸载超出范围的区块
		const allChunks = world.getChunkList();
		for (const chunk of allChunks) {
			const dx = chunk.chunkPos.x - playerChunkPos.x;
			const dz = chunk.chunkPos.z - playerChunkPos.z;
			const dist = Math.max(Math.abs(dx), Math.abs(dz));
			if (dist > unloadRadius) {
				world.unloadChunk(chunk.chunkPos);
			}
		}
	}

	public async generateWorld(): Promise<World> {
		const world = new World(this.scene);
		const radius = this.radius;

		for (let cx = -radius; cx < radius; cx++) {
			for (let cz = -radius; cz < radius; cz++) {
				const pos = { x: cx, y: 0, z: cz };
				const chunk = await this.generateChunk(world, pos);
				chunk.render();
			}
		}

		return world;
	}

	public renderChunks(world: World) {
		world.getChunkList().forEach((chunk: Chunk) => {
			chunk.render();
		});
	}

	public async generateFlatWorld() {
		const world = new World(this.scene);
		const radius = this.radius;
		for (let cx = -radius; cx < radius; cx++) {
			for (let cz = -radius; cz < radius; cz++) {
				const chunk = this.createFlatChunk(cx, cz, 0, world);
				world.setChunk({ x: cx, y: 0, z: cz }, chunk);
				chunk.render();
			}
		}

		return world;
	}

	private async generateChunk(world: World, chunkPos: Position) {
		await this.noiseWorkerReady;
		const chunk = new Chunk(chunkPos, world);
		const { climateData, blockGrid, surfaceBlocks } = await this.noiseWorker!.generateTerrain(
			chunkPos.x * CHUNK_SIZE,
			chunkPos.z * CHUNK_SIZE,
			CHUNK_SIZE,
			CHUNK_HEIGHT
		);

		Object.setPrototypeOf(blockGrid, Grid3D.prototype); // 重新绑定一下原型链，因为序列化之后原型链会丢失
		chunk.setClimateData(climateData);
		chunk.setVirtualBlocks(blockGrid);
		chunk.setActiveBlocksBySurfaceBlocks(surfaceBlocks);
		world.setChunk(chunkPos, chunk);
		return chunk;
	}

	private createFlatChunk(cx: number, cz: number, height: number, world: World): Chunk {
		const chunk = new Chunk({ x: cx, y: 0, z: cz }, world);
		chunk.setVirtualBlocks(new Grid3D(CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE));
		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let z = 0; z < CHUNK_SIZE; z++) {
				const wx = cx * CHUNK_SIZE + x;
				const wz = cz * CHUNK_SIZE + z;
				const block = blockFactory.createBlock(
					this.scene,
					Blocks.Grass,
					new Vector3(wx, height, wz)
				);
				chunk.setBlockSynchronous(new Vector3(x, height, z), block);
			}
		}

		return chunk;
	}
}

export default WorldGenerator;
