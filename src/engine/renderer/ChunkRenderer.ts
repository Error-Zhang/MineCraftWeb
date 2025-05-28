import { Material, Mesh, Scene, TransformNode, Vector3, VertexData } from "@babylonjs/core";
import { Chunk } from "../chunk/Chunk";
import { BlockRegistry } from "../block/BlockRegistry";
import { ChunkMeshBuilder, FaceDirectionOffset } from "./ChunkMeshBuilder";
import { BlockMaterialManager } from "../renderer/BlockMaterialManager.ts";
import { ModelRender } from "../types/block.type.ts";
import { Position } from "../types/chunk.type.ts";
import { ChunkManager } from "../chunk/ChunkManager.ts";

export class ChunkRenderer {
	private root: TransformNode;
	private modelInstances: Map<string, TransformNode> = new Map();
	private renderedBlocks: Set<string> = new Set(); // 区块内部坐标

	constructor(
		public scene: Scene,
		public chunk: Chunk
	) {
		this.root = new TransformNode(`chunk-${chunk.position.x},${chunk.position.z}`, scene);
		this.root.position.set(
			chunk.position.x * ChunkManager.ChunkSize,
			0,
			chunk.position.z * ChunkManager.ChunkSize
		);
	}

	public update(positions: Position[]) {
		const toUpdate = this.renderedBlocks;
		for (const pos of positions) {
			toUpdate.add(`${pos.x},${pos.y},${pos.z}`);

			for (const [dx, dy, dz] of FaceDirectionOffset) {
				const nk = `${pos.x + dx},${pos.y + dy},${pos.z + dz}`;
				toUpdate.add(nk);
			}
		}
		if (!toUpdate.size) return;
		this.build(toUpdate);
	}

	public build(filter?: Set<string>) {
		this.root.dispose();
		const { meshGroups, modelBlocks, renderedBlocks } = ChunkMeshBuilder.build(this.chunk, filter);
		this.renderedBlocks = renderedBlocks;

		// 创建网格
		for (const [matKey, vertexData] of Object.entries(meshGroups)) {
			const material = BlockMaterialManager.getMaterialByKey(this.scene, matKey);
			this.createMesh(matKey, vertexData, material);
		}

		if (!filter) {
			this.buildModelBlocks(modelBlocks);
		}
	}

	// bugfix:如果你在某天发现本应该被销毁的网格回到了世界原点，那一定是dispose出了问题
	public dispose() {
		this.modelInstances.forEach(modelInstance => {
			modelInstance.dispose();
		});
		this.modelInstances.clear();
		this.root.dispose();
	}

	public setEnabled(enabled: boolean) {
		this.modelInstances.forEach(modelInstance => {
			modelInstance.setEnabled(enabled);
		});
		this.root.setEnabled(enabled);
	}

	public async addModelBlock(posKey: string, blockId: number) {
		const [x, y, z] = posKey.split(",").map(Number);
		const def = BlockRegistry.Instance.getById(blockId)!;
		const render = <ModelRender>def.render;
		const model = await render.loadModel(this.scene, new Vector3(x, y, z));
		model.metadata = { blockId };
		this.modelInstances.set(posKey, model);
	}

	public removeModelBlock(posKey: string) {
		this.modelInstances.get(posKey)?.dispose();
		this.modelInstances.delete(posKey);
	}

	private createMesh(name: string, vertexData: VertexData, material: Material): Mesh {
		const mesh = new Mesh(name, this.scene);
		vertexData.applyToMesh(mesh);
		mesh.material = material;

		// 获取材质中的网格属性配置
		const meshProperties = (material as any).metadata?.meshProperties;

		// 设置默认值
		mesh.isPickable = true;
		mesh.checkCollisions = true;
		mesh.isVisible = true;

		// 应用材质中配置的网格属性
		if (meshProperties) {
			if (meshProperties.isPickable !== undefined) mesh.isPickable = meshProperties.isPickable;
			if (meshProperties.checkCollisions !== undefined)
				mesh.checkCollisions = meshProperties.checkCollisions;
			if (meshProperties.isVisible !== undefined) mesh.isVisible = meshProperties.isVisible;
		}

		mesh.setParent(this.root);
		return mesh;
	}

	private async buildModelBlocks(modelBlocks: Map<string, number>) {
		// 1. 清理旧模型（位置不存在或 ID 已变）
		for (const [key, instance] of this.modelInstances.entries()) {
			const newId = modelBlocks.get(key);
			const oldId = instance.metadata.blockId as number;

			if (!newId || oldId !== newId) {
				instance.dispose();
				this.modelInstances.delete(key);
			}
		}

		// 2. 添加或更新模型
		for (const [posKey, blockId] of modelBlocks.entries()) {
			if (!this.modelInstances.has(posKey)) {
				this.addModelBlock(posKey, blockId);
			}
		}
	}
}
