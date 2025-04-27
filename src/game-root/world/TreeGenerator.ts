import {Scene, Vector3} from "@babylonjs/core";
import {World} from "@/game-root/world/World.ts";
import {Blocks} from "@/blocks/core/Blocks.ts";
import blockFactory from "@/blocks/core/BlockFactory.ts";

type TreeType = "oak" | "jungle";

interface TreeOptions {
    trunkHeight?: number;
    crownHeight?: number;
    crownRadius?: number;
    type?: TreeType;
}

class TreeGenerator {
    constructor(private scene: Scene, private world: World) {
    }

    generateTree(position: Vector3, options: TreeOptions = {}) {
        const type = options.type ?? "oak";

        switch (type) {
            case "oak":
                this.generateOakTree(position, options);
                break;
            case "jungle":
                this.generateJungleTree(position, options);
                break;
        }
    }

    private generateOakTree(position: Vector3, {trunkHeight = 4, crownHeight = 3, crownRadius = 2}: TreeOptions) {
        // 你的基础生成逻辑（球形树冠）
        for (let y = 0; y < trunkHeight; y++) {
            const trunkPos = position.add(new Vector3(0, y, 0));
            const trunkBlock = blockFactory.createBlock(this.scene, Blocks.Log, trunkPos);
            const targetBlock=this.world.getBlockGlobal(trunkPos)
            if(targetBlock) targetBlock.dispose();
            this.world.setBlockGlobal(trunkBlock);
        }

        const crownBaseY = position.y + trunkHeight;
        for (let y = 0; y < crownHeight; y++) {
            const radius = crownRadius - Math.floor(y / 2);
            for (let x = -radius; x <= radius; x++) {
                for (let z = -radius; z <= radius; z++) {
                    const dist = Math.abs(x) + Math.abs(z);
                    if (dist <= radius + 1) {
                        const leafPos = new Vector3(position.x + x, crownBaseY + y, position.z + z);
                        const leafBlock = blockFactory.createBlock(this.scene, Blocks.Leaves, leafPos);
                        this.world.setBlockGlobal(leafBlock);
                    }
                }
            }
        }
    }



    private generateJungleTree(position: Vector3, {trunkHeight = 10, crownHeight = 4, crownRadius = 3}: TreeOptions) {

        // 树干更粗，2x2 的结构
        for (let y = 0; y < trunkHeight; y++) {
            for (let dx = 0; dx <= 1; dx++) {
                for (let dz = 0; dz <= 1; dz++) {
                    const trunkPos = position.add(new Vector3(dx, y, dz));
                    const trunkBlock = blockFactory.createBlock(this.scene, Blocks.Log, trunkPos);
                    this.world.setBlockGlobal(trunkBlock);
                }
            }
        }

        // 树冠位置起点：在顶部以上
        const crownBaseY = position.y + trunkHeight;

        // 树冠更宽更平坦
        for (let y = 0; y < crownHeight; y++) {
            const radius = crownRadius - Math.floor(y / 2); // 缩小半径
            for (let x = -radius; x <= radius + 1; x++) {
                for (let z = -radius; z <= radius + 1; z++) {
                    const dist = Math.abs(x) + Math.abs(z);
                    if (dist <= radius + 1) {
                        const leafPos = new Vector3(position.x + x, crownBaseY + y, position.z + z);
                        const leafBlock = blockFactory.createBlock(this.scene, Blocks.Leaves, leafPos);
                        this.world.setBlockGlobal(leafBlock);
                    }
                }
            }
        }
    }

}

export default TreeGenerator;