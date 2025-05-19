export enum Blocks {
	Air, // 不要修改Air的顺序，因为代码中为省事做的是布尔判断，其他可以修改
	Water,
	Grass,
	Dirt,
	GraniteStone, // 花岗岩
	BasaltStone, // 玄武岩
	Sand,
	SandStone,
	Board,
	Log,
	Leaves,
	CraftTable,
}

export function getBlocksKey(value: Blocks): string {
	return Object.keys(Blocks).find(key => Blocks[key as keyof typeof Blocks] === value)!;
}
