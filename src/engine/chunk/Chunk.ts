import { ChunkData } from "../types/chunk.type.ts";
import { ChunkManager } from "../chunk/ChunkManager.ts";
import { BlockRegistry } from "@engine/block/BlockRegistry.ts";
import { BlockEntity } from "@engine/types/block.type.ts";

export class Chunk {
	public readonly position: { x: number; z: number };

	public blocks: Uint16Array;
	// 该属性影响是否需要重新渲染
	public isDirty: boolean = false;
	// 该属性影响是否渲染
	public isVisible: boolean = false;

	public dirtyBlocks: Record<string, number> = {};
	blockEntities: Map<string, BlockEntity> = new Map();

	constructor(x: number, z: number) {
		this.position = { x, z };
		// block[y * size * size + z * size + x] → blockId
		this.blocks = new Uint16Array(
			ChunkManager.ChunkSize * ChunkManager.ChunkSize * ChunkManager.ChunkHeight
		);
	}

	public get Key() {
		return `${this.position.x},${this.position.z}`;
	}

	public static fromJSON(data: ChunkData): Chunk {
		const chunk = new Chunk(data.position.x, data.position.z);
		chunk.blocks = Uint16Array.from(data.blocks);
		return chunk;
	}

	public getBlock(x: number, y: number, z: number): number {
		if (!this.isInBounds(x, y, z)) return 0; // 默认返回空气
		return this.blocks[this.index(x, y, z)];
	}

	public setBlock(x: number, y: number, z: number, blockId: number): void {
		if (!this.isInBounds(x, y, z)) return;
		this.blocks[this.index(x, y, z)] = blockId;
		this.dirtyBlocks[`${x},${y},${z}`] = blockId;
		this.isDirty = true;
		const def = BlockRegistry.Instance.getById(blockId);
		if (def?.createEntity) {
			this.setBlockEntity(x, y, z, def.createEntity());
		}
	}

	public getBlockEntity(x: number, y: number, z: number) {
		return this.blockEntities.get(`${x},${y},${z}`);
	}

	public setBlockEntity(x: number, y: number, z: number, entity: BlockEntity) {
		this.blockEntities.set(`${x},${y},${z}`, entity);
	}

	public removeBlockEntity(x: number, y: number, z: number) {
		this.blockEntities.delete(`${x},${y},${z}`);
	}

	public toJSON(): ChunkData {
		return {
			position: this.position,
			blocks: Array.from(this.blocks),
			dirtyBlocks: this.dirtyBlocks,
		};
	}

	public isInBounds(x: number, y: number, z: number): boolean {
		return (
			x >= 0 &&
			x < ChunkManager.ChunkSize &&
			z >= 0 &&
			z < ChunkManager.ChunkSize &&
			y >= 0 &&
			y < ChunkManager.ChunkHeight
		);
	}

	private index(x: number, y: number, z: number): number {
		return y * ChunkManager.ChunkSize * ChunkManager.ChunkSize + z * ChunkManager.ChunkSize + x;
	}
}
