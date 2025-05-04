import { BlockEntity } from "@/blocks/core/BlockDecorators.ts";
import { TextureBlock } from "@/blocks/core/Block.ts";
import { UVHelper } from "@/game-root/utils/UVHelper.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.Sand)
class SandBlock extends TextureBlock {
	override uv = UVHelper.uniform([2, 1]);
}

export default SandBlock;
