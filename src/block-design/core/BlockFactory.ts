import BlockType from "../definitions/BlockType";
import blockRecipes, { BlockRecipe } from "../definitions/BlockRecipes.ts";
import blockData, { BlockDefinition, RenderType } from "../definitions/BlockData.ts";
import { Block, BlockConstructor, CubeBlock } from "../core/Block.ts";

class BlockFactory {
	private blockRecipeMap: Map<BlockType, BlockRecipe[]> = new Map();
	private blockEntityMap: Map<BlockType, Block> = new Map();
	private blockIdMap: Array<BlockType> = [];

	constructor() {
		this.registerBlocks();
		this.registerBlockRecipes();
	}

	getBlockRecipes() {
		return blockRecipes;
	}

	getBlockById(id: number) {
		let blockType = this.blockIdMap[id];
		if (!blockType) return;
		return this.getBlockByType(blockType);
	}

	getBlockByType(blockType: BlockType) {
		return this.blockEntityMap.get(blockType);
	}

	getDisplayBlockTypes() {
		return Object.entries(this.blockEntityMap)
			.filter(([, block]) => {
				return (block as Block).definition.isDisplay;
			})
			.map(([blockType]) => blockType) as BlockType[];
	}

	registerBlockId(id: number, blockType: BlockType) {
		this.blockIdMap[id] = blockType;
	}

	private registerBlockRecipes() {
		blockRecipes.forEach(recipe => {
			const outPutType = recipe.output.item;
			if (this.blockRecipeMap.has(outPutType)) {
				this.blockRecipeMap.get(outPutType)!.push(recipe);
			} else {
				this.blockRecipeMap.set(outPutType, [recipe]);
			}
		});
	}

	private getBlockClass() {
		const blockClassMap: Map<BlockType, typeof Block> = new Map();
		const modules: Record<string, any> = import.meta.glob("/src/block-design/blocks/**/*.ts", {
			eager: true,
		});
		for (const [_, mod] of Object.entries(modules)) {
			const BlockClass = mod.default;
			if (BlockClass && BlockClass.__blockType) {
				blockClassMap.set(BlockClass.__blockType, BlockClass);
			}
		}
		return blockClassMap;
	}

	private registerBlocks() {
		const blockClassMap = this.getBlockClass();
		Object.entries(blockData).forEach(([key, definition]) => {
			const blockType = key as BlockType;
			if (blockClassMap.has(blockType)) {
				const BlockClass = blockClassMap.get(blockType) as BlockConstructor;
				this.blockEntityMap.set(blockType, new BlockClass(blockType, definition));
			} else {
				this.registerBlock(blockType, definition);
			}
		});
	}

	private registerBlock(blockType: BlockType, definition: BlockDefinition) {
		switch (definition.renderType) {
			case RenderType.Cube:
				this.blockEntityMap.set(blockType, new CubeBlock(blockType, definition));
				return;
			case RenderType.Model:
				return;
				throw new Error(
					`${blockType}被指定为模型方块，模型方块需要有具体的实现类，但文件中并未找到`
				);
		}
	}
}

const blockFactory = new BlockFactory();
export default blockFactory;
