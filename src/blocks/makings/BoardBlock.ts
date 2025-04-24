import {BlockEntity} from "@/blocks/BlockDecorators.ts";
import {TextureBlock} from "@/blocks/Block.ts";
import {Scene, Vector3} from "@babylonjs/core";
import {UVHelper} from "@/game-root/utils/UVHelper.ts";
import {Blocks} from "@/enums/Blocks.ts";

@BlockEntity(Blocks.Board)
class BoardBlock extends TextureBlock {
    constructor(scene: Scene, position: Vector3) {
        const uv = UVHelper.uniform([4, 0]);
        super({scene, blockType: Blocks.Board, position, uv: uv});
    }
}

export default BoardBlock;