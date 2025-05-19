import { BlockEntity } from "@/blocks/core/BlockDecorators.ts";
import { TextureBlock } from "@/blocks/core/Block.ts";
import { UVHelper } from "@/game-root/utils/UVHelper.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.GraniteStone)
class GraniteStoneBlock extends TextureBlock {
	override uv = UVHelper.uniform([1, 0]);
}

export default GraniteStoneBlock;
