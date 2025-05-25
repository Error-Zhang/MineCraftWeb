import BlockType from "@/game-root/block-definitions/BlockType.ts";

export type BlockRecipe = {
	pattern: (BlockType | null)[][]; // 排列
	output: {
		item: BlockType;
		count: number;
	}; // 主产物
	byproducts?: {
		item: BlockType;
		count: number;
	}[]; // 副产物
	allowPlayerLevel?: number;
	allowCrafts?: BlockType[]; // 允许使用的工作台
	allowMirrored?: boolean; // 是否允许左右镜像合成（默认 false）
};

const blockRecipes: BlockRecipe[] = [
	// 木板：1 个原木 → 4 块木板
	{
		pattern: [[BlockType.OakWoodBlock]],
		output: { item: BlockType.OakPlankBlock, count: 4 },
	},

	// 工作台：4 个木板 → 1 个工作台
	{
		pattern: [
			[BlockType.OakPlankBlock, BlockType.OakPlankBlock],
			[BlockType.OakPlankBlock, BlockType.OakPlankBlock],
		],
		output: { item: BlockType.CraftTableBlock, count: 1 },
	},
];
export default blockRecipes;
