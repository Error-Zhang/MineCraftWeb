import { ChunkData } from "../types/chunk.type.ts";
import { ChunkManager } from "../chunk/ChunkManager.ts";
import { BlockRegistry } from "@engine/block/BlockRegistry.ts";
import { BlockEntity } from "@engine/types/block.type.ts";

export class Chunk {
	public readonly position: { x: number; z: number };

	public blocks: Uint16Array; // 最多支持65536种不同方块
	// 该属性影响是否需要重新渲染
	public isDirty: boolean = false;
	// 该属性影响是否渲染
	public isVisible: boolean = true;
	// 该属性表示区块的边界状态 [0,1,2,3] 分别表示 x-,x+,z-,z+ 边界
	public edges: number[] = [];

	public dirtyBlocks: Record<string, number> = {};
	public blockEntities: Record<string, BlockEntity> = {};
	public shafts: ChunkData["shafts"] = [];

	constructor(x: number, z: number) {
		this.position = { x, z };
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
		chunk.shafts = data.shafts;
		chunk.dirtyBlocks = data.dirtyBlocks;
		return chunk;
	}

	public setIsVisible(visible: boolean): void {
		this.isVisible = visible;
	}

	public getBlock(x: number, y: number, z: number): number {
		if (!this.isInBounds(x, y, z)) return -1;
		return this.blocks[this.index(x, y, z)] ?? 0;
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
		return this.blockEntities[`${x},${y},${z}`];
	}

	public setBlockEntity(x: number, y: number, z: number, entity: BlockEntity) {
		this.blockEntities[`${x},${y},${z}`] = entity;
	}

	public removeBlockEntity(x: number, y: number, z: number) {
		delete this.blockEntities[`${x},${y},${z}`];
	}

	public toJSON(): ChunkData {
		return {
			position: this.position,
			blocks: Array.from(this.blocks),
			dirtyBlocks: this.dirtyBlocks,
			shafts: this.shafts,
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
		return y + x * ChunkManager.ChunkHeight + z * ChunkManager.ChunkHeight * ChunkManager.ChunkSize;
	}
}
