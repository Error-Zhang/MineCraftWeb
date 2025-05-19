import { Block, ModelBlock } from "@/blocks/core/Block.ts";
import { Mesh, Nullable, Vector3 } from "@babylonjs/core";
import { FaceDirectionOffset, Faces, FaceType, FaceTypes } from "@/blocks/core/BlockMeshBuilder.ts";
import { World } from "./World.ts";
import AirBlock from "@/blocks/natures/AirBlock.ts";
import { Blocks } from "@/blocks/core/Blocks.ts";
import blockFactory from "@/blocks/core/BlockFactory.ts";
import { Grid3D } from "@/game-root/noise/Grid.ts";

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128; // 目前暂时无法更改高度因为地形生成算法里面是写死的

export interface Position {
	x: number;
	y: number;
	z: number;
}

export interface ClimateData {
	temperature: number;
	humidity: number;
	// 可扩展更多属性，例如：biome、rainfall、elevation 等
}

export class Chunk {
	public isActive: boolean = false;
	chunkMesh?: Mesh;
	private climateData?: ClimateData[][];
	private virtualBlocks?: Grid3D;
	private activeBlocks: Map<string, Block> = new Map();

	constructor(
		public chunkPos: Position,
		private world: World
	) {}

	private _worldPos?: { x: number; y: 0; z: number };

	get worldPos(): { x: number; y: 0; z: number } {
		if (!this._worldPos) {
			this._worldPos = {
				x: this.chunkPos.x * CHUNK_SIZE,
				y: 0,
				z: this.chunkPos.z * CHUNK_SIZE,
			};
		}
		return this._worldPos;
	}

	setClimateData(data: ClimateData[][]) {
		this.climateData = data;
	}

	setVirtualBlocks(blocks: Grid3D) {
		this.virtualBlocks = blocks;
	}

	getClimateData(x: number, z: number): ClimateData | null {
		if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
			return this.climateData![x][z];
		}
		return null;
	}

	getKey({ x, y, z }: Position) {
		return `${x},${y},${z}`;
	}

	setActiveBlock(pos: Position, block: Nullable<Block>) {
		let key = this.getKey(pos);
		if (block) this.activeBlocks.set(key, block);
		else this.activeBlocks.delete(key);
	}

	setVirtualBlock(pos: Position, block: Nullable<Blocks>) {
		this.virtualBlocks!.set(pos.x, pos.y, pos.z, block ?? Blocks.Air);
	}

	// 同步更新两个方块表
	setBlockSynchronous(pos: Position, block: Nullable<Block>) {
		this.setActiveBlock(pos, block);
		this.setVirtualBlock(pos, block?.blockType || null);
	}

	toWorldPos(localPos: Position) {
		return {
			x: localPos.x + this.worldPos.x,
			y: localPos.y,
			z: localPos.z + this.worldPos.z,
		};
	}

	createBlockByVirtual(pos: Position) {
		const blockType = this.getVirtualBlock(pos);
		if (blockType) {
			const block = blockFactory.createBlock(
				this.world.scene,
				blockType,
				new Vector3(this.worldPos.x + pos.x, pos.y, this.worldPos.z + pos.z)
			);
			return block;
		}
		return null;
	}

	// 放置前对原方块进行销毁
	safeSetBlock(pos: Position, block: Nullable<Block>) {
		const isAirBlock = block instanceof AirBlock;
		// 销毁方块
		if (!block || isAirBlock) {
			this.getBlockGlobal(pos)?.dispose();
		}
		this.setBlockSynchronous(pos, isAirBlock ? null : block);
	}

	setBlockGlobalAndRenderSingle(pos: Position, block: Nullable<Block>, faces?: Faces) {
		if (this.inBounds(pos)) {
			this.trySetActiveBlockAndRenderSingle(pos, block, faces);
		} else {
			this.world.setBlockSingle(this.toWorldPos(pos), block, faces);
		}
	}

	safeGetBlock(pos: Position) {
		const block = this.getBlockGlobal(pos);
		return block ?? this.createBlockByVirtual(pos);
	}

	tryUpdateNeighbors(pos: Position, block: Nullable<Block>) {}

	/**
	 * 更新某个位置的方块并重新渲染(玩家触发，千万不要大量调用！！！)
	 * @param localPos 这里是相对坐标
	 * @param block
	 */
	safeUpdateBlockAndEffectNeighbor(localPos: Vector3, block: Block) {
		const isDelete = block instanceof AirBlock;
		// 获取该方块周围可能受影响的方块位置
		const affectedPositions = Object.values(FaceDirectionOffset)
			.map(offset => localPos.add(offset))
			.concat(localPos);
		// 记录一下原来的方块类型
		const prevBlockType = this.getVirtualBlock(localPos);
		// 放置方块
		this.safeSetBlock(localPos, block);

		// 模型不会影响周围的环境
		if (block instanceof ModelBlock) {
			this.setBlockSynchronous(localPos, block);
			block.render();
			return;
		}

		// 如果原来的方块存在加入set
		const affectedBlockTypes = new Set<Blocks>();
		prevBlockType && affectedBlockTypes.add(prevBlockType);

		// 对每个受影响的方块进行渲染更新
		for (const affectedPos of affectedPositions) {
			const isInBounds = this.inBounds(affectedPos);
			const affectedBlock = this.safeGetBlock(affectedPos);
			// 透明方块不受影响
			if (!affectedBlock || affectedBlock instanceof ModelBlock) continue;

			// 获取该方块可见面
			const visibleFaces = this.calculateVisibleFaces(affectedPos);
			// 如果该方块更新后所有面均不可见直接销毁否则重新渲染
			if (visibleFaces) {
				this.setBlockGlobalAndRenderSingle(affectedPos, affectedBlock, visibleFaces);
			} else {
				// 委托给对应的区块删除面
				this.setBlockGlobalAndRenderSingle(affectedPos, null);
			}
			affectedBlockTypes.add(affectedBlock.blockType);
		}
		// 在删除方块的时候重新合并网格
		if (isDelete && affectedBlockTypes.size) {
			this.mergeMesh(affectedBlockTypes);
		}
	}

	hasAllNeighbors(): boolean {
		const { x, y, z } = this.chunkPos;

		const offsets = [
			[-1, 0, 0], // left
			[1, 0, 0], // right
			[0, 0, -1], // front
			[0, 0, 1], // back
		];

		for (const [dx, dy, dz] of offsets) {
			if (!this.world.isChunkLoaded({ x: x + dx, y: y + dy, z: z + dz })) {
				return false;
			}
		}

		return true;
	}

	/**
	 * 获取当前位置的方块类型
	 * @param pos
	 * @param safe 防止无限递归
	 */
	getBlockGlobal(pos: Position, safe = false) {
		if (this.inBounds(pos)) {
			return this.getActiveBlock(pos);
		} else if (!safe) {
			const global = this.toGlobal(pos);
			return this.world.getBlockGlobal(global, true);
		}
		return null;
	}

	getVirtualBlock(pos: Position, safe = false) {
		if (this.inBounds(pos)) {
			return this.virtualBlocks!.get(pos.x, pos.y, pos.z) || null; // 归一化处理
		} else if (!safe) {
			const global = this.toGlobal(pos);
			return this.world.getVirtualBlockGlobal(global, true);
		}
		return null;
	}

	// 计算一个方块的可见面
	calculateVisibleFaces(pos: Position) {
		const visibleFaces: Partial<Record<FaceType, boolean>> = {};
		let flag = false;
		const current = this.getVirtualBlock(pos);
		const currentBlockClass = blockFactory.getBlockClass(current!);
		const isTransparent = currentBlockClass?.__isTransparent;

		for (const face of FaceTypes) {
			const offset = FaceDirectionOffset[face];
			const neighborPos = { x: offset.x + pos.x, y: offset.y + pos.y, z: offset.z + pos.z };
			const neighbor = this.getVirtualBlock(neighborPos);

			if (isTransparent) {
				// 透明方块：只渲染邻接空气（null）的面
				if (
					neighbor !== undefined &&
					(neighbor === null || neighbor !== current || (neighbor && currentBlockClass?.isSpecial))
				) {
					visibleFaces[face] = true;
					flag = true;
				}
			} else {
				// 不透明方块：渲染邻接透明或空气的面
				if (
					neighbor !== undefined &&
					(neighbor === null || blockFactory.getBlockClass(neighbor)?.__isTransparent)
				) {
					visibleFaces[face] = true;
					flag = true;
				}
			}
		}

		return flag && visibleFaces;
	}

	trySetActiveBlock(pos: Position, block: Block) {
		let key = this.getKey(pos);
		if (!this.activeBlocks.has(key)) {
			this.activeBlocks.set(key, block);
		}
	}

	trySetActiveBlockAndRenderSingle(pos: Position, block: Nullable<Block>, faces?: Faces) {
		const activeBlock = this.getBlockGlobal(pos);
		// 新增
		if (block && !activeBlock) {
			this.setBlockSynchronous(pos, block);
			block.tryRender(faces);
			return true;
		}
		// 删除
		else if (activeBlock && !block) {
			activeBlock?.dispose();
			this.activeBlocks.delete(this.getKey(pos));
			return true;
		}
		// 替换
		else if (block && activeBlock) {
			activeBlock?.dispose();
			this.activeBlocks.delete(this.getKey(pos));
			this.setBlockSynchronous(pos, block);
			block.tryRender(faces);
		}
		// 全都没有什么都不做
		return false;
	}

	getActiveBlock(pos: Position) {
		return this.activeBlocks.get(this.getKey(pos));
	}

	render(render: boolean = true) {
		// 保护
		if (render === this.isActive) return;
		this.isActive = render;
		if (!render) {
			this.dispose();
			return;
		}
		this.mergeMesh();
	}

	disposeActiveBlocks() {
		this.activeBlocks.forEach((block: Block) => {
			block.dispose();
		});
	}

	dispose() {
		this.chunkMesh?.dispose();
		this.disposeActiveBlocks();
	}

	getPosition(key: string): Position {
		const [x, y, z] = key.split(",").map(Number);
		return { x, y, z };
	}

	mergeMesh(blockTypes?: Set<Blocks>) {
		const groupedMeshes = new Map<number, Mesh[]>();

		// Step 1: 按 blockType 分组 mesh（可指定类型列表）
		for (const [key, block] of this.activeBlocks) {
			if (block instanceof ModelBlock) continue;

			// 如果指定了 blockTypes 且当前 block 不在其中，则跳过
			if (blockTypes && !blockTypes.has(block.blockType)) continue;

			const visibleFaces = this.calculateVisibleFaces(this.getPosition(key));
			if (visibleFaces) {
				const mesh = block.createMesh?.(visibleFaces);
				if (mesh && mesh instanceof Mesh) {
					if (!groupedMeshes.has(block.blockType)) {
						groupedMeshes.set(block.blockType, []);
					}
					groupedMeshes.get(block.blockType)!.push(mesh);
				}
			}
		}

		const mergedMeshes: Mesh[] = [];

		// Step 2: 合并每一组 mesh
		for (const [blockType, meshes] of groupedMeshes.entries()) {
			if (meshes.length === 0) continue;

			const reference = meshes[0];
			const merged = Mesh.MergeMeshes(meshes, false, true, undefined, false, true)!;
			merged.checkCollisions = reference.checkCollisions;
			merged.isPickable = reference.isPickable;
			merged.metadata = { blockType };
			mergedMeshes.push(merged);
		}

		// Step 3: 设置 chunkMesh
		if (!blockTypes) {
			this.chunkMesh?.dispose();
			// 全量合并
			const container = new Mesh("chunk-container", this.world.scene);
			mergedMeshes.forEach(mesh => mesh.setParent(container));

			// Step 4: 销毁所有 block 的 mesh 资源
			this.activeBlocks.forEach(block => block.dispose());
			this.chunkMesh = container;
		} else {
			// 局部更新：替换指定类型的子 mesh
			if (!this.chunkMesh) {
				console.error("网格尚未初始化，无法进行局部更新");
				return;
			}

			// 先清理对应 blockType 的旧 mesh
			this.chunkMesh.getChildMeshes().forEach(child => {
				if (child.metadata?.blockType !== undefined && blockTypes.has(child.metadata.blockType)) {
					child.dispose();
				}
			});

			// 添加新的 merged mesh
			mergedMeshes.forEach(mesh => mesh.setParent(this.chunkMesh!));
			// 清空所有单个方块的网格
			this.disposeActiveBlocks();
		}
	}

	calcSurfaceBlocks() {
		// 请求worker
	}

	setActiveBlocksBySurfaceBlocks(surfaceBlocks: Set<string>) {
		Array.from(surfaceBlocks).forEach(key => {
			if (surfaceBlocks.has(key)) {
				const block = this.createBlockByVirtual(this.getPosition(key))!;
				this.activeBlocks.set(key, block);
			}
		});
	}

	private inBounds(pos: Position): boolean {
		return (
			pos.x >= 0 &&
			pos.x < CHUNK_SIZE &&
			pos.y >= 0 &&
			pos.y < CHUNK_HEIGHT &&
			pos.z >= 0 &&
			pos.z < CHUNK_SIZE
		);
	}

	private toGlobal(pos: Position) {
		return {
			x: this.chunkPos.x * CHUNK_SIZE + pos.x,
			y: pos.y,
			z: this.chunkPos.z * CHUNK_SIZE + pos.z,
		};
	}
}
