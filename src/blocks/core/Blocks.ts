export enum Blocks {
	Air = "", // 不要修改Air的值，因为代码中为省事做的是判空，其他值可以修改
	Grass = "草方块",
	Dirt = "泥土",
	Stone = "原石",
	Board = "木板",
	Log = "原木",
	Leaves = "树叶",
	CraftTable = "工作台",
}

export function getBlocksKey(value: Blocks): string {
	return Object.keys(Blocks).find(key => Blocks[key as keyof typeof Blocks] === value)!;
}
