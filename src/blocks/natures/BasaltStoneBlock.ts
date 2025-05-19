import { BlockEntity } from "@/blocks/core/BlockDecorators.ts";
import { TextureBlock } from "@/blocks/core/Block.ts";
import { UVHelper } from "@/game-root/utils/UVHelper.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.BasaltStone)
class BasaltStoneBlock extends TextureBlock {
	override uv = UVHelper.uniform([6, 0]);
}

export default BasaltStoneBlock;
