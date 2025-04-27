import {BlockEntity} from "@/blocks/core/BlockDecorators.ts";
import {TextureBlock} from "@/blocks/core/Block.ts";
import {Color3, Scene, Vector3} from "@babylonjs/core";
import {UVHelper} from "@/game-root/utils/UVHelper.ts";
import {Blocks} from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.Leaves)
class LeavesBlock extends TextureBlock {
    override color = Color3.Green(); // 绿色
    constructor(scene: Scene, position: Vector3) {
        const uv = UVHelper.uniform([4, 3]);
        super({scene, position, uv: uv,isTransparent: true});
    }
}

export default LeavesBlock;