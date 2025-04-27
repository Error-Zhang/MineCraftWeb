import {BlockEntity} from "@/blocks/core/BlockDecorators.ts";
import {TextureBlock} from "@/blocks/core/Block.ts";
import {Scene, Vector3} from "@babylonjs/core";
import {UVHelper} from "@/game-root/utils/UVHelper.ts";
import {Blocks} from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.Stone)
class StoneBlock extends TextureBlock {
    constructor(scene: Scene, position: Vector3) {
        const uv = UVHelper.uniform([1, 0]);
        super({scene, position, uv: uv});
    }
}

export default StoneBlock;