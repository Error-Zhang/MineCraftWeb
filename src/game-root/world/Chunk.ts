import {Block} from "@/blocks/Block.ts";
import {Vector2, Vector3} from "@babylonjs/core";
import {FaceDirectionOffset, FaceType, FaceTypes} from "@/game-root/utils/BlockMeshBuilder.ts";
import {World} from "./World.ts";
import AirBlock from "@/blocks/natures/AirBlock.ts";

export const CHUNK_SIZE = 8;
export const CHUNK_HEIGHT = 64;

export class Chunk {
    private blocks: (Block)[][][];

    constructor(public chunkPos: Vector2, private world: World) {
        this.blocks = Array.from({length: CHUNK_SIZE}, (_, x) =>
            Array.from({length: CHUNK_HEIGHT}, (_, y) =>
                Array.from({length: CHUNK_SIZE}, (_, z) =>
                    new AirBlock(this.world.scene,new Vector3(x, y, z))
                )
            )
        );
    }


    setBlock(pos: Vector3, block: Block) {
        this.blocks[pos.x][pos.y][pos.z] = block;
    }

    /**
     * 更新某个位置的方块并重新渲染
     * @param pos
     * @param block
     */
    updateBlock(pos: Vector3, block: Block) {
        const prevBlock = this.getBlock(pos);

        // 获取该方块周围可能受影响的方块位置
        const affectedPositions = Object.values(FaceDirectionOffset).map(offset => pos.add(offset)).concat(pos);

        // 销毁方块
        if (block instanceof AirBlock) prevBlock.dispose();
        // 放置方块
        this.setBlock(pos, block);
        // 对每个受影响的方块进行渲染更新
        for (const affectedPos of affectedPositions) {
            const affectedBlock = this.getBlock(affectedPos);
            // 透明方块不受影响
            if(affectedBlock.isTransparent && !affectedPos.equals(pos)) continue;
            // 获取该方块可见面
            const visibleFaces: Partial<Record<FaceType, boolean>> = this.calculateVisibleFaces(affectedPos);
            // 如果该方块更新后所有面均不可见直接销毁否则重新渲染
            Object.keys(visibleFaces).length ? affectedBlock.render(visibleFaces) : affectedBlock.dispose();
        }
    }

    /**
     * 获取当前位置的方块类型
     * @param pos
     * @param safe 防止无限递归
     */
    getBlock(pos: Vector3, safe = false): Block {
        if (this.inBounds(pos)) {
            return this.blocks[pos.x][pos.y][pos.z];
        } else if (!safe) {
            const global = this.toGlobal(pos);
            return this.world.getBlockGlobal(global, true);
        }
        return new AirBlock(this.world.scene,pos);
    }

    // 计算一个方块的可见面
    calculateVisibleFaces(pos: Vector3): Partial<Record<FaceType, boolean>> {
        const visibleFaces: Partial<Record<FaceType, boolean>> = {};

        for (const face of FaceTypes) {
            const offset = FaceDirectionOffset[face];
            const neighborPos = pos.add(offset);
            const neighbor = this.getBlock(neighborPos);

            if (neighbor.isTransparent) {
                visibleFaces[face] = true;
            }
        }

        return visibleFaces;
    }

    render() {
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const block = this.blocks[x][y][z];
                    if (block instanceof AirBlock) continue;
                    const visibleFaces = this.calculateVisibleFaces(new Vector3(x, y, z))
                    block.render(visibleFaces);
                }
            }
        }
    }

    private inBounds(pos: Vector3): boolean {
        return (
            pos.x >= 0 && pos.x < CHUNK_SIZE &&
            pos.y >= 0 && pos.y < CHUNK_HEIGHT &&
            pos.z >= 0 && pos.z < CHUNK_SIZE
        );
    }

    private toGlobal(pos: Vector3): Vector3 {
        return new Vector3(
            this.chunkPos.x * CHUNK_SIZE + pos.x,
            pos.y,
            this.chunkPos.y * CHUNK_SIZE + pos.z
        );
    }
}
