import {Scene, Vector3} from "@babylonjs/core";
import {UVHelper} from "@/game-root/utils/UVHelper.ts";
import {TextureBlock} from "@/blocks/core/Block.ts";
import {BlockEntity} from "@/blocks/core/BlockDecorators.ts";
import {Blocks} from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.Log)
class LogBlock extends TextureBlock {
    constructor(scene: Scene, position: Vector3) {
        const uv = UVHelper.topBottomSide(
            [5, 1], // 顶面
            [5, 1], // 底面
            [4, 1] // 侧面
        );
        super({scene, position, uv: uv});
    }
}

export default LogBlock;