import {Color3, Scene, Vector3} from "@babylonjs/core";
import {UVHelper} from "@/game-root/utils/UVHelper.ts";
import {TextureBlock} from "@/blocks/core/Block.ts";
import {BlockEntity} from "@/blocks/core/BlockDecorators.ts";
import {Blocks} from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.Grass)
class GrassBlock extends TextureBlock {
    constructor(scene: Scene, position: Vector3) {
        const uv = UVHelper.topBottomSide(
            [0, 0], // 顶面：草地
            [2, 0], // 底面：泥土
            [3, 0] // 侧面：草地侧面
        );
        super({scene, position, uv: uv});
    }
}

export default GrassBlock; // 实体方块必须单文件并使用default导出(涉及到图标生成)