import { Nullable, Scene, Vector3 } from "@babylonjs/core";
import { Blocks } from "@/blocks/core/Blocks.ts";
import { Block } from "@/blocks/core/Block.ts";
import { BlockRecipe } from "@/blocks/core/BlockTypes.ts"; // 导入 BlockRecipe 类型

class BlockFactory {
	private static instance: BlockFactory;

	private classMap: Map<Blocks, typeof Block> = new Map();
	private recipeMap: Map<Blocks, BlockRecipe[]> = new Map();

	private constructor() {
		this.registerAll();
	}

	public static getInstance(): BlockFactory {
		if (!BlockFactory.instance) {
			BlockFactory.instance = new BlockFactory();
		}
		return BlockFactory.instance;
	}

	public getBlockClass(type: Blocks): typeof Block | undefined {
		return this.classMap.get(type);
	}

	// 注册单个方块类
	public register(type: Blocks, blockClass: typeof Block) {
		this.classMap.set(type, blockClass);
		this.registerRecipes(blockClass);
	}

	// 创建方块实例
	public createBlock(scene: Scene, type: Blocks, pos: Vector3): Nullable<Block> {
		const BlockClass = this.classMap.get(type) as any;
		if (BlockClass) {
			return new BlockClass(scene, pos);
		}
		return null;
	}

	// 获取所有方块配方
	public getAllBlockRecipes(): Map<Blocks, BlockRecipe[]> {
		return this.recipeMap;
	}

	// 获取某个方块的所有配方
	public getRecipesForBlock(blockType: Blocks): BlockRecipe[] {
		return this.recipeMap.get(blockType) ?? [];
	}

	// 获取所有注册的方块类型
	public getAllRegisterBlocks(): Blocks[] {
		return Array.from(this.classMap.keys());
	}

	// 手动注册额外方块类
	public registerManually(type: Blocks, blockClass: typeof Block) {
		this.classMap.set(type, blockClass);
		this.registerRecipes(blockClass);
	}

	// 注册所有方块（自动）
	private async registerAll() {
		const modules: Record<string, any> = import.meta.glob("/src/blocks/**/*.ts", { eager: true });
		for (const [_, mod] of Object.entries(modules)) {
			const BlockClass = mod.default;
			if (BlockClass && BlockClass.__isEntityBlock) {
				this.classMap.set(BlockClass.__blockType as Blocks, BlockClass);
				this.registerRecipes(BlockClass);
			}
		}
	}

	// 注册配方
	private registerRecipes(BlockClass: typeof Block) {
		if (BlockClass.getRecipes) {
			const recipes: BlockRecipe[] = [];
			for (let recipe of BlockClass.getRecipes()) {
				recipes.push(recipe);
			}
			if (recipes.length > 0) {
				this.recipeMap.set(BlockClass.__blockType, recipes);
			}
		}
	}
}

const blockFactory = BlockFactory.getInstance();
export default blockFactory;
