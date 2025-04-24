export enum Blocks {
    Air = "",
    Grass = "草方块",
    Dirt = "泥土",
    Stone = "原石",
    Board = "木板",
    Log = "原木",
    Leaf = "树叶",
    CraftTable = "工作台",
}
export function getBlocksKey(value: Blocks): string{
    return Object.keys(Blocks).find((key) => Blocks[key as keyof typeof Blocks] === value)!;
}

