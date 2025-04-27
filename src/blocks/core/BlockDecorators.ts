import {Blocks} from "@/blocks/core/Blocks.ts";

interface BlockInfo {
    description: string;
}

/**
 * 实体方块需要添加该注解，在BlockFactory和generateAllBlockIcons中会自动查找注册
 * @param blockType
 * @param blockInfo
 * @constructor
 */
export function BlockEntity(blockType: Blocks, blockInfo?: Partial<BlockInfo>) {
    return function (target: any) {
        // 将传入的参数与类关联
        target.__isEntityBlock = true;
        target.__blockType = blockType;
        target.__blockInfo = blockInfo;
    }
}
