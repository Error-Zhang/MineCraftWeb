import { BlockDefinition } from "../types/block.type";
import { SingleClass } from "@engine/core/Singleton.ts";
import { TagID, TagManager } from "./TagManager";

export class BlockRegistry extends SingleClass {
	public readonly tagManager: TagManager;
	private blocks: BlockDefinition<any>[] = [];
	private nameToIdMap = new Map<string, number>();
	private nextId = 1;
	private namespaceToIdMap = new Map<string, Set<number>>();
	private readonly DEFAULT_NAMESPACE = "minecraft";

	constructor() {
		super();
		this.tagManager = new TagManager();
	}

	public static override get Instance(): BlockRegistry {
		return this.getInstance();
	}

	public registerBlock(block: BlockDefinition<any>, namespace?: string) {
		// 验证方块
		this.validateBlock(block, namespace);

		// 分配 ID（如果没有提供）
		if (block.id === undefined) {
			block.id = this.assignId();
		}

		// 处理命名空间
		const blockNamespace = namespace || this.getNamespace(block.blockType);

		// 注册方块
		this.blocks[block.id] = block;
		this.nameToIdMap.set(this.getFullName(block.blockType), block.id);

		// 添加到命名空间映射
		if (!this.namespaceToIdMap.has(blockNamespace)) {
			this.namespaceToIdMap.set(blockNamespace, new Set());
		}
		this.namespaceToIdMap.get(blockNamespace)!.add(block.id);

		// 注册标签
		if (block.tags) {
			block.tags.forEach(tag => {
				const tagId = this.getTagId(tag);
				this.tagManager.addToTag(tagId, [block.id!]);
			});
		}
	}

	public registerBlocks(blocks: BlockDefinition<any>[], namespace?: string) {
		// 先注册有 ID 的方块
		const blocksWithId = blocks.filter(block => block.id !== undefined);
		blocksWithId.forEach(block => this.registerBlock(block, namespace));

		// 再注册没有 ID 的方块
		const blocksWithoutId = blocks.filter(block => block.id === undefined);
		blocksWithoutId.forEach(block => this.registerBlock(block, namespace));
	}

	public getById(id: number) {
		if (id === 0 || id === -1) return {} as BlockDefinition<any>;
		const definition = this.blocks[id];
		if (!definition) throw new Error(`Block ${id} not found`);
		return this.blocks[id];
	}

	public getByName(name: string) {
		// 如果名称不包含命名空间，添加默认命名空间
		const id = this.nameToIdMap.get(this.getFullName(name));
		if (!id) throw new Error(`Block ${name} not found`);
		return this.getById(id);
	}

	public getByTag(tag: string) {
		const tagId = this.getTagId(tag);
		const members = this.tagManager.getMembers(tagId);
		return members.map(id => this.getById(id));
	}

	public getByNamespace(namespace: string) {
		const ids = this.namespaceToIdMap.get(namespace);
		if (!ids) return [];
		return Array.from(ids)
			.map(id => this.blocks[id])
			.filter(block => block !== undefined);
	}

	public getAllBlocks<T extends Record<string, any>>(): BlockDefinition<T>[] {
		return this.blocks.filter(block => block !== undefined);
	}

	public getNamespaces() {
		return Array.from(this.namespaceToIdMap.keys());
	}

	public getTagsForBlock(name: string) {
		const id = this.nameToIdMap.get(name);
		return this.getById(id!)?.tags || [];
	}

	private getFullName(name: string) {
		return name.includes(":") ? name : `${this.DEFAULT_NAMESPACE}:${name}`;
	}

	private getTagId(tag: string) {
		return (tag.startsWith("#") ? tag : `#${this.DEFAULT_NAMESPACE}:${tag}`) as TagID;
	}

	private validateBlock(block: BlockDefinition<any>, namespace?: string) {
		// 检查必需字段
		if (!block.blockType) {
			throw new Error("Block must have a name");
		}
		if (!block.tags) {
			throw new Error(`Block ${block.blockType} must have tags`);
		}
		if (!block.render) {
			throw new Error(`Block ${block.blockType} must have a render component`);
		}

		// 处理完整名称
		const blockNamespace = namespace || this.getNamespace(block.blockType);
		const fullName = block.blockType.includes(":")
			? block.blockType
			: `${blockNamespace}:${block.blockType}`;

		// 检查名称唯一性
		if (this.nameToIdMap.has(fullName)) {
			throw new Error(`Block with name "${fullName}" is already registered`);
		}

		// 检查 ID 唯一性（如果提供了 ID）
		if (block.id !== undefined) {
			if (this.blocks[block.id] !== undefined) {
				throw new Error(`Block with ID ${block.id} is already registered`);
			}
			if (block.id < 1 || block.id > 65535) {
				throw new Error(`Block ${fullName} has invalid ID: ${block.id}`);
			}
		}

		// 验证渲染类型
		const validRenderTypes = ["cube", "cross", "model"];
		if (!validRenderTypes.includes(block.render.type)) {
			throw new Error(`Block ${fullName} has invalid render type: ${block.render.type}`);
		}
	}

	private assignId() {
		let id = this.nextId;
		while (this.blocks[id] !== undefined) {
			id++;
		}
		this.nextId = id + 1;
		return id;
	}

	private getNamespace(name: string) {
		return name.includes(":") ? name.split(":")[0] : this.DEFAULT_NAMESPACE;
	}
}
