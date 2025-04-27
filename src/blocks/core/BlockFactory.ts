import {Scene, Vector3} from "@babylonjs/core";
import {Blocks} from "@/blocks/core/Blocks.ts";
import {Block} from "@/blocks/core/Block.ts";
import AirBlock from "@/blocks/natures/AirBlock.ts";
import { BlockRecipe } from "@/blocks/core/BlockTypes.ts";  // 导入 BlockRecipe 类型

class BlockFactory {
    private static instance: BlockFactory;
    private classMap: Record<string, any> = {};
    private recipeMap: Record<string, BlockRecipe[]> = {}; // 存储配方

    private constructor() {
        this.registerAll();
    }

    public static getInstance(): BlockFactory {
        if (!BlockFactory.instance) {
            BlockFactory.instance = new BlockFactory();
        }
        return BlockFactory.instance;
    }

    // 注册所有方块
    private async registerAll() {
        const modules: Record<string, any> = import.meta.glob("/src/blocks/**/*.ts", {eager: true});
        for (const [_, mod] of Object.entries(modules)) {
            const BlockClass = mod.default;
            if (BlockClass && BlockClass.__isEntityBlock) {
                this.classMap[BlockClass.__blockType] = BlockClass;
                // 自动绑定配方
                this.registerRecipes(BlockClass);
            }
        }
    }

    // 注册单个方块类
    public register(type: string, blockClass: any) {
        this.classMap[type] = blockClass;
        this.registerRecipes(blockClass); // 自动注册配方
    }

    // 自动注册配方
    private registerRecipes(BlockClass: typeof Block) {
        if (BlockClass.getRecipes) {
            const recipeGenerator = BlockClass.getRecipes();  // 获取生成器实例
            const recipes: BlockRecipe[] = [];
            // 获取所有生成的配方
            for (let recipe of recipeGenerator) {
                recipes.push(recipe);  // 将每个配方添加到数组
            }
            if (recipes && recipes.length > 0) {
                // 为该方块类型创建配方表
                this.recipeMap[BlockClass.__blockType] = recipes;
            }
        }
    }

    // 创建方块实例
    public createBlock(scene: Scene, type: Blocks, pos: Vector3): Block {
        const BlockClass = this.classMap[type];

        if (BlockClass) {
            return new BlockClass(scene, pos);
        }
        console.error(`Block type "${type}" not found, using AirBlock`);
        return new AirBlock(scene, pos);
    }

    public getAllBlockRecipes = ()=>{
        return this.recipeMap;
    }

    // 获取某个方块的所有配方
    public getRecipesForBlock(blockType: Blocks): BlockRecipe[] {
        return this.recipeMap[blockType] || [];
    }

    // 获取所有注册的方块类型
    public getAllRegisterBlocks(){
        return Object.keys(this.classMap) as Blocks[];
    }

    // 可选：允许手动注册额外方块类
    public registerManually(type: string, blockClass: any) {
        this.classMap[type] = blockClass;
        this.registerRecipes(blockClass);
    }
}

const blockFactory = BlockFactory.getInstance();
export default blockFactory;
