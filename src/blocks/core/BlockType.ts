// 每个方块的定义结构
interface TBlockDefinition {
	id: number;
	name: string;
	isTransparent: boolean;
	texture: string;
}

class BlockRegistry {
	private static readonly _blocks: Record<EBlock, number> = {} as Record<EBlock, number>;

	static get count() {
		return Object.keys(BlockRegistry).length;
	}

	static getBlockId(block: EBlock) {
		return this._blocks;
	}

	static registerBlocks() {}
}
