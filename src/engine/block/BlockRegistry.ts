import { BlockDefinition } from "../types/block.type";

export class BlockRegistry {
	private static instance: BlockRegistry;
	private blocks: Map<number, BlockDefinition<any>> = new Map();
	private blocksByName = new Map<string, BlockDefinition<any>>();
	private blocksByTag = new Map<string, Set<BlockDefinition<any>>>();
	private nextId = 1;

	private constructor() {}

	public static get Instance(): BlockRegistry {
		if (!BlockRegistry.instance) {
			BlockRegistry.instance = new BlockRegistry();
		}
		return BlockRegistry.instance;
	}

	private validateBlock(block: BlockDefinition<any>): void {
		// 检查必需字段
		if (!block.name) {
			throw new Error("Block must have a name");
		}
		if (!block.tags) {
			throw new Error(`Block ${block.name} must have tags`);
		}
		if (!block.render) {
			throw new Error(`Block ${block.name} must have a render component`);
		}
		
		// 检查名称唯一性
		if (this.blocksByName.has(block.name)) {
			throw new Error(`Block with name "${block.name}" is already registered`);
		}

		// 检查 ID 唯一性（如果提供了 ID）
		if (block.id !== undefined) {
			if (this.blocks.has(block.id)) {
				throw new Error(`Block with ID ${block.id} is already registered`);
			}
			if (block.id < 1) {
				throw new Error(`Block ${block.name} has invalid ID: ${block.id}`);
			}
		}

		// 验证渲染类型
		const validRenderTypes = ["cube", "cross", "model"];
		if (!validRenderTypes.includes(block.render.type)) {
			throw new Error(`Block ${block.name} has invalid render type: ${block.render.type}`);
		}
	}

	public registerBlock(block: BlockDefinition<any>): BlockDefinition<any> {
		// 验证方块
		this.validateBlock(block);

		// 分配 ID（如果没有提供）
		if (block.id === undefined) {
			block.id = this.assignId();
		}

		// 注册方块
		this.blocks.set(block.id, block);
		this.blocksByName.set(block.name, block);

		// 注册标签
		for (const tag of block.tags) {
			if (!this.blocksByTag.has(tag)) {
				this.blocksByTag.set(tag, new Set());
			}
			this.blocksByTag.get(tag)!.add(block);
		}

		return block;
	}

	public registerBlocks(blocks: BlockDefinition<any>[]): void {
		for (const block of blocks) {
			this.registerBlock(block);
		}
	}

	public getById(id: number): BlockDefinition<any> | undefined {
		return this.blocks.get(id);
	}

	public getByName(name: string): BlockDefinition<any> | undefined {
		return this.blocksByName.get(name);
	}

	public getByTag(tag: string): BlockDefinition<any>[] {
		return Array.from(this.blocksByTag.get(tag) || []);
	}

	public getAllBlocks(): BlockDefinition<any>[] {
		return Array.from(this.blocks.values());
	}

	private assignId(): number {
		let id = this.nextId;
		while (this.blocks.has(id)) {
			id++;
		}
		this.nextId = id + 1;
		return id;
	}
}
