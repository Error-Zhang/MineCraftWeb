import {Scene, Vector3} from "@babylonjs/core";
import {Blocks} from "@/enums/Blocks";
import {Block} from "@/blocks/Block.ts";
import AirBlock from "@/blocks/natures/AirBlock.ts";


class BlockFactory {
    private static instance: BlockFactory;
    private classMap: Record<string, any> = {};

    private constructor() {
        this.registerAll();
    }

    public static getInstance(): BlockFactory {
        if (!BlockFactory.instance) {
            BlockFactory.instance = new BlockFactory();
        }
        return BlockFactory.instance;
    }

    private async registerAll() {
        const modules: Record<string, any> = import.meta.glob("/src/blocks/**/*.ts", {eager: true});
        for (const [_, mod] of Object.entries(modules)) {
            const BlockClass = mod.default;
            if (BlockClass && BlockClass.__isEntityBlock) {
                this.classMap[BlockClass.__blockType] = BlockClass;
            }
        }
    }

    public createBlock(scene: Scene, type: Blocks, pos: Vector3): Block {
        const BlockClass = this.classMap[type];

        if (BlockClass) {
            return new BlockClass(scene, pos);
        }
        console.error(`Block type "${type}" not found, using AirBlock`);
        return new AirBlock(scene, pos);
    }

    public getAllRegisterBlocks(){
        return Object.keys(this.classMap) as Blocks[];
    }

    // 可选：允许手动注册额外方块类
    public register(type: string, blockClass: any) {
        this.classMap[type] = blockClass;
    }
}

const blockFactory = BlockFactory.getInstance();

export default blockFactory;
