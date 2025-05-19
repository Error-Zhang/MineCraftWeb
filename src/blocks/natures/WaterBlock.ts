import { BlockEntity } from "@/blocks/core/BlockDecorators.ts";
import { TextureBlock } from "@/blocks/core/Block.ts";
import { Color3 } from "@babylonjs/core";
import { UVHelper } from "@/game-root/utils/UVHelper.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";

@BlockEntity(Blocks.Water)
class WaterBlock extends TextureBlock {
	static override __isTransparent = true;
	static override __isCollision = false;
	static override __isAnimator = true;

	override color = new Color3(0.5, 0.9, 0.9);

	override uv = UVHelper.uniform([12, 10]);

	override onCreatedMesh() {
		this.mesh!.scaling.y = 0.9;
		this.mesh!.isPickable = false;
	}
}

export default WaterBlock;
