import {
	ImportMeshAsync,
	MeshBuilder,
	Scene,
	StandardMaterial,
	TransformNode,
	Vector3,
} from "@babylonjs/core";

class BlockMeshRegistry {
	static meshes: Map<string, TransformNode> = new Map();

	static async loadModel(modelPath: string, scene: Scene, setMaterial: Function) {
		if (this.meshes.has(modelPath)) return this.meshes.get(modelPath)!.clone(modelPath, null)!;

		const { meshes } = await ImportMeshAsync(modelPath, scene);
		const root = new TransformNode(`${modelPath}_root`, scene);

		for (const mesh of meshes.filter(m => m.name !== "__root__")) {
			mesh.setParent(root);
			setMaterial(mesh);
		}
		// 防止坐标原点出现模型实体
		root.setEnabled(false);

		this.meshes.set(modelPath, root);
		// 返回克隆体防止本体被摧毁后所有克隆体全部消失
		return root.clone(modelPath, null)!;
	}

	static attachCollider(scene: Scene, node: TransformNode) {
		const collider = MeshBuilder.CreateBox(`ModelCollider`, { size: 1 }, scene);

		const transparentMaterial = new StandardMaterial(`ModelColliderMaterial`, scene);
		transparentMaterial.alpha = 0;

		collider.material = transparentMaterial;
		collider.checkCollisions = true;
		collider.isPickable = true;
		collider.visibility = 0;

		collider.setParent(node);
		collider.position = new Vector3(0, 0.5, 0); // 相对于 node
	}
}

export default BlockMeshRegistry;
