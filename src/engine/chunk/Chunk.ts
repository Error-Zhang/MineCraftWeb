import { ChunkData } from "../types/chunk.type.ts";
import { ChunkManager } from "../chunk/ChunkManager.ts";
import { BlockRegistry } from "@engine/block/BlockRegistry.ts";
import { BlockEntity } from "@engine/types/block.type.ts";

export class Chunk {
	public position!: { x: number; z: number };
	public blocks!: Uint16Array;
	public edges: Set<number> = new Set();
	public blockEntities: Record<string, BlockEntity> = {};
	public shafts!: ChunkData["shafts"];
	public isVisible: boolean = true;

	constructor() {}

	public get Key() {
		return `${this.position.x},${this.position.z}`;
	}

	public static fromJSON(data: ChunkData): Chunk {
		const chunk = new Chunk();
		chunk.position = data.position;
		chunk.blocks = data.blocks;
		chunk.shafts = data.shafts;
		return chunk;
	}

	public getBlock(x: number, y: number, z: number): number {
		if (!this.isInBounds(x, y, z)) return -1;
		return this.blocks[this.index(x, y, z)] ?? 0;
	}

	public getEnvironment(x: number, z: number): number {
		return this.shafts[x + z * ChunkManager.ChunkSize] || -1;
	}

	public setBlock(x: number, y: number, z: number, blockId: number) {
		if (!this.isInBounds(x, y, z)) return;
		this.blocks[this.index(x, y, z)] = blockId;
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
