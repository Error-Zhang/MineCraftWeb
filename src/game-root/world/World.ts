import {Scene, Vector2, Vector3} from "@babylonjs/core";
import { Chunk, CHUNK_SIZE } from "./Chunk.ts";
import { Block } from "@/blocks/Block.ts";
import AirBlock from "@/blocks/natures/AirBlock.ts";

export class World {
    private chunks: Map<string, Chunk> = new Map();

    constructor(public scene: Scene) {

    }

    getChunk(chunkPos: Vector2): Chunk | null {
        return this.chunks.get(`${chunkPos.x},${chunkPos.y}`) ?? null;
    }

    setChunk(chunkPos: Vector2, chunk: Chunk) {
        this.chunks.set(`${chunkPos.x},${chunkPos.y}`, chunk);
    }

    private _getChunkAndLocalPos(pos: Vector3): { chunk: Chunk | null, localPos: Vector3 } {
        const chunkX = Math.floor(pos.x / CHUNK_SIZE);
        const chunkZ = Math.floor(pos.z / CHUNK_SIZE);
        const chunk = this.getChunk(new Vector2(chunkX, chunkZ));

        const localX = (pos.x % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = (pos.z % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
        const localPos = new Vector3(localX, pos.y, localZ);

        return { chunk, localPos };
    }

    getBlockGlobal(pos: Vector3, safe = false): Block {
        const { chunk, localPos } = this._getChunkAndLocalPos(pos);
        if (!chunk) return new AirBlock(this.scene,pos);
        return chunk.getBlock(localPos, safe);
    }

    setBlockGlobal(block: Block) {
        const { chunk, localPos } = this._getChunkAndLocalPos(block.position);
        if (!chunk) return false;
        chunk.updateBlock(localPos, block);
        return true;
    }
}
