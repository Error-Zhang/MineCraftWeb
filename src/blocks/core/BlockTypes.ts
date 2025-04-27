import {Blocks} from "@/blocks/core/Blocks.ts";

export type BlockRecipe = {
    pattern: (Blocks | undefined | null)[][];
    output: {
        item: Blocks;
        count: number;
    };
    byproducts?: {
        item: Blocks;
        count: number;
    }[];
    allowPlayerLevel?: number;
    allowCrafts?: string[];
    allowMirrored?: boolean; // 是否允许左右镜像合成（默认 false）
};