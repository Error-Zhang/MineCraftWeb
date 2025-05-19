import {
	AbstractMesh,
	MeshBuilder,
	Scene,
	StandardMaterial,
	TransformNode,
	Vector3,
} from "@babylonjs/core";

import { BlockDefinition } from "../definitions/BlockData.ts";
import BlockType from "../definitions/BlockType";
import BlockMeshRegistry from "./BlockMeshRegistry.ts";

export type BlockConstructor = new (blockType: BlockType, definition: BlockDefinition) => Block;

export abstract class Block {
	growable?: {
		stage: number;
		maxStage: number;

		grow(): void;
	};

	constructor(
		public readonly blockType: BlockType,
		public readonly definition: BlockDefinition
	) {}

	canPlace(blockType: BlockType): boolean {
		return true;
	}
}

export class CubeBlock extends Block {}

export class GrassBlock extends Block {
	override canPlace(blockType: BlockType): boolean {
		return blockType === BlockType.DirtBlock || blockType === BlockType.GrassBlock;
	}
}

export class LeavesBlock extends Block {}

export class FluidBlock extends Block {}

export abstract class ModelBlock extends Block {
	transform: TransformNode | undefined;

	abstract setMaterial(mesh: AbstractMesh): void;

	async loadModel(scene: Scene, position: Vector3) {
		const modelKey = `${this.blockType}`;
		const node = await BlockMeshRegistry.getOrLoadTransformNode(
			this.blockType,
			this.definition.modelPath!,
			scene,
			this.setMaterial
		);
		node.position = position.add(new Vector3(0.5, 0, 0.5));
		this.attachCollider(node, scene, modelKey);
		return node;
	}

	async render(scene: Scene, position: Vector3) {
		this.transform = await this.loadModel(scene, position);
	}

	setActive(active: boolean) {
		this.transform?.setEnabled(active);
	}

	dispose(): void {
		this.transform?.dispose();
	}

	private attachCollider(node: TransformNode, scene: Scene, modelKey: string) {
		if (!this.definition.isCollision) return;

		const collider = MeshBuilder.CreateBox(`${modelKey}Collider`, { size: 1 }, scene);

		const transparentMaterial = new StandardMaterial(`${modelKey}`, scene);
		transparentMaterial.alpha = 0;

		collider.material = transparentMaterial;
		collider.checkCollisions = true;
		collider.isPickable = true;
		collider.visibility = 0;

		collider.setParent(node);
		collider.position = new Vector3(0, 0.5, 0); // 相对于 node
	}
}

export class FlowerBlock extends ModelBlock {
	override canPlace(blockType: BlockType): boolean {
		return blockType === BlockType.DirtBlock || blockType === BlockType.GrassBlock;
	}

	setMaterial(mesh: AbstractMesh): void {}
}
