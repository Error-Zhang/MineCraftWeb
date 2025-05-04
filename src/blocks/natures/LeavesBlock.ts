import { BlockEntity } from "@/blocks/core/BlockDecorators.ts";
import { TextureBlock } from "@/blocks/core/Block.ts";
import { Color3 } from "@babylonjs/core";
import { UVHelper } from "@/game-root/utils/UVHelper.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.Leaves)
class LeavesBlock extends TextureBlock {
	static override __isTransparent = true;
	override color = Color3.Green(); // 绿色
	override uv = UVHelper.uniform([4, 3]);
}

export default LeavesBlock;
