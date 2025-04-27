import {BlockEntity} from "@/blocks/core/BlockDecorators.ts";
import {TextureBlock} from "@/blocks/core/Block.ts";
import {Scene, Vector3} from "@babylonjs/core";
import {UVHelper} from "@/game-root/utils/UVHelper.ts";
import {Blocks} from "@/blocks/core/Blocks.ts";
import {BlockRecipe} from "@/blocks/core/BlockTypes.ts";

@BlockEntity(Blocks.Board)
class BoardBlock extends TextureBlock {
    constructor(scene: Scene, position: Vector3) {
        const uv = UVHelper.uniform([4, 0]);
        super({scene, position, uv: uv});
    }
    static override *getRecipes(): Generator<BlockRecipe> {
        yield {
            pattern: [
                [Blocks.Log],
            ],
            output: {
                item: this.__blockType, // 使用注解中的字段
                count: 4
            }
        };
    }
}

export default BoardBlock;