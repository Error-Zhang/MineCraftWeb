import {BlockEntity} from "@/blocks/BlockDecorators.ts";
import {TextureBlock} from "@/blocks/Block.ts";
import {Scene, Vector3} from "@babylonjs/core";
import {UVHelper} from "@/game-root/utils/UVHelper.ts";
import {Blocks} from "@/enums/Blocks.ts";

@BlockEntity(Blocks.Dirt)
class DirtBlock extends TextureBlock {
    constructor(scene: Scene, position: Vector3) {
        const uv = UVHelper.uniform([2, 0]);
        super({scene, blockType: Blocks.Dirt, position, uv: uv});
    }
}

export default DirtBlock;