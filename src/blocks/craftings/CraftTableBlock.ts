import { BlockEntity } from "@/blocks/core/BlockDecorators.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";
import { ModelBlock, TextureBlock } from "@/blocks/core/Block.ts";
import { AbstractMesh, Scene, Vector3 } from "@babylonjs/core";
import { BlockMaterialManager } from "@/blocks/core/BlockMaterialManager.ts";
import { IInteractableBlock } from "@/blocks/core/BlockInterfaces.ts";
import { GameEvents } from "@/game-root/events/GameEvents.ts";
import { gameEventBus } from "@/game-root/events/GameEventBus.ts";
import { BlockRecipe } from "@/blocks/core/BlockTypes.ts";
import { getBlockModel } from "@/assets";
import MathUtils from "@/game-root/utils/MathUtils.ts";

@BlockEntity(Blocks.CraftTable)
class CraftTableBlock extends ModelBlock implements IInteractableBlock {
	static override __isInteractable = true;
	static override maxCount: number = 1;
	override readonly guid: string;

	constructor(scene: Scene, position: Vector3) {
		super({ scene, position }, getBlockModel("CraftTable"));
		this.guid = MathUtils.generateGUID();
	}

	static override *getRecipes(): Generator<BlockRecipe> {
		yield {
			pattern: [
				[Blocks.Board, Blocks.Board],
				[Blocks.Board, Blocks.Board],
			],
			output: {
				item: this.__blockType, // 使用注解中的字段
				count: 1,
			},
		};
	}

	override onInteract(): void {
		gameEventBus.emit(GameEvents.interactWithBlock, { blockType: this.blockType, guid: this.guid });
	}

	override setMaterial(mesh: AbstractMesh, config: any): void {
		const material = BlockMaterialManager.getBlockMaterial({
			scene: this.scene,
			texturePath: TextureBlock.texturePath,
			blockType: Blocks.CraftTable,
			...config,
		});
		mesh.material = material;
	}
}

export default CraftTableBlock;
