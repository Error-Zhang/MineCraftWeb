import { ImportMeshAsync, Scene, TransformNode } from "@babylonjs/core";
import BlockType from "../definitions/BlockType";

class BlockMeshRegistry {
	static meshes: Map<BlockType, TransformNode> = new Map();

	static async getOrLoadTransformNode(
		blockType: BlockType,
		modelPath: string,
		scene: Scene,
		setMaterial: Function
	) {
		if (this.meshes.has(blockType)) return this.meshes.get(blockType)!.clone(blockType, null)!;

		const { meshes } = await ImportMeshAsync(modelPath, scene);
		const root = new TransformNode(`${blockType}_root`, scene);

		for (const mesh of meshes.filter(m => m.name !== "__root__")) {
			mesh.setParent(root);
			setMaterial(mesh);
		}

		this.meshes.set(blockType, root);
		return root.clone(blockType, null)!;
	}
}

export default BlockMeshRegistry;
