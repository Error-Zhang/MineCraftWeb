import {BlockEntity} from "@/blocks/BlockDecorators.ts";
import {TextureBlock} from "@/blocks/Block.ts";
import {Scene, Vector3} from "@babylonjs/core";
import {UVHelper} from "@/game-root/utils/UVHelper.ts";
import {Blocks} from "@/enums/Blocks.ts";

@BlockEntity(Blocks.Leaf)
class LeafBlock extends TextureBlock {
    constructor(scene: Scene, position: Vector3) {
        const uv = UVHelper.uniform([6, 1]);
        super({scene, blockType: Blocks.Leaf, position, uv: uv,isTransparent: true});
    }
}

export default LeafBlock;