import { Nullable, Scene, Vector3 } from "@babylonjs/core";
import { Chunk, CHUNK_HEIGHT, CHUNK_SIZE, Position } from "./Chunk.ts";
import { Block } from "@/blocks/core/Block.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";
import { Faces } from "@/blocks/core/BlockMeshBuilder.ts";

export class World {
	private chunks: Map<string, Chunk> = new Map();

	private worldName: string = "";
	private _lastChunkKey?: string = "0,0";

	constructor(public scene: Scene) {}

	getChunkList() {
		return Array.from(this.chunks.values());
	}

	/**
	 * 判断玩家是否进入了新的区块
	 * @param pos 世界坐标
	 * @returns true 表示发生了区块变化
	 */
	hasChunkChanged(pos: Position): boolean {
		const chunkX = Math.floor(pos.x / CHUNK_SIZE);
		const chunkZ = Math.floor(pos.z / CHUNK_SIZE);
		const currentKey = `${chunkX},${chunkZ}`;

		if (this._lastChunkKey !== currentKey) {
			this._lastChunkKey = currentKey;
			return true;
		}

		return false;
	}

	getHeightAt(position: Position) {
		const { chunk, localPos } = this._getChunkAndLocalPos({
			x: position.x,
			y: 0,
			z: position.z,
		});
		console.log(chunk);
		if (!chunk) return 0;

		// 从顶部开始查找有方块的高度
		for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
			const block = chunk.getVirtualBlock({ x: localPos.x, y, z: localPos.z }, true);
			if (block) {
				return y;
			}
		}

		return 0;
	}

	getChunk(chunkPos: Position) {
		return this.chunks.get(`${chunkPos.x},${chunkPos.z}`);
	}

	setChunk(chunkPos: Position, chunk: Chunk) {
		this.chunks.set(`${chunkPos.x},${chunkPos.z}`, chunk);
	}

	unloadChunk(chunkPos: Position) {
		this.chunks.get(`${chunkPos.x},${chunkPos.z}`)?.dispose();
		this.chunks.delete(`${chunkPos.x},${chunkPos.z}`);
	}

	activeChunk(chunkPos: Position, isActive: boolean) {
		this.getChunk(chunkPos)?.render(isActive);
	}

	getBlockGlobal(pos: Position, safe = false): Nullable<Block> | undefined {
		const { chunk, localPos } = this._getChunkAndLocalPos(pos);
		if (!chunk) return void 0; // 用undefined来标记不存在
		return chunk.getBlockGlobal(localPos, safe) || null;
	}

	getVirtualBlockGlobal(pos: Position, safe = false): Nullable<Blocks> | undefined {
		const { chunk, localPos } = this._getChunkAndLocalPos(pos);
		if (!chunk) return void 0; // 用undefined来标记不存在
		return chunk.getVirtualBlock(localPos, safe) || null;
	}

	setBlockSingle(worldPos: Position, block: Nullable<Block>, faces?: Faces) {
		const { chunk, localPos } = this._getChunkAndLocalPos(worldPos);
		if (!chunk) return false;
		chunk.trySetActiveBlockAndRenderSingle(localPos, block, faces);
		return true;
	}

	setBlockGlobal(block: Block) {
		const { chunk, localPos } = this._getChunkAndLocalPos(block.position);
		if (!chunk) return false;
		chunk.safeUpdateBlockAndEffectNeighbor(new Vector3(localPos.x, localPos.y, localPos.z), block);
		return true;
	}

	private _getChunkAndLocalPos(pos: Position) {
		const chunkX = Math.floor(pos.x / CHUNK_SIZE);
		const chunkZ = Math.floor(pos.z / CHUNK_SIZE);
		const chunk = this.getChunk({ x: chunkX, y: 0, z: chunkZ });

		const localX = ((pos.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
		const localZ = ((pos.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
		const localPos = { x: localX, y: pos.y, z: localZ };

		return { chunk, localPos };
	}
}
