import { ImportMeshAsync, MeshBuilder, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { SingleClass } from "@engine/core/Singleton.ts";
import { BlockMaterialManager } from "@engine/renderer/BlockMaterialManager.ts";

class ModelBlockManager extends SingleClass {
	meshes: Map<string, TransformNode> = new Map();

	constructor(public scene: Scene) {
		super();
	}

	static get Instance(): ModelBlockManager {
		return this.getInstance();
	}

	dispose(): void {
		this.meshes.clear();
	}

	async loadModel(modelPath: string, setMesh: Function) {
		let key = `${modelPath}}`;
		if (this.meshes.has(key)) return this.meshes.get(key)!.clone(key, null)!;
		const { meshes } = await ImportMeshAsync(modelPath, this.scene);
		const root = new TransformNode(`${key}_root`, this.scene);

		for (const mesh of meshes.filter(m => m.name !== "__root__")) {
			mesh.setParent(root);
			setMesh(mesh);
			mesh.renderingGroupId = 1;
		}
		// 防止坐标原点出现模型实体
		root.setEnabled(false);
		this.meshes.set(key, root);
		// 返回克隆体防止本体被摧毁后所有克隆体全部消失
		return root.clone(key, null)!;
	}

	attachCollider(node: TransformNode, offset: Vector3, size: Vector3) {
		const collider = MeshBuilder.CreateBox(
			"block_collider", // 不可更改射线检测时会进行判断
			{ width: size.x, height: size.y, depth: size.z },
			this.scene
		);

		// 模型淡入淡出效果的需要
		const mat = BlockMaterialManager.Instance.getMaterialByKey(
			BlockMaterialManager.PRESET_MATERIALS.MODEL_COLLIDER
		);

		collider.material = mat;
		// 开发时需要
		collider.visibility = 1;
		collider.renderingGroupId = 1;

		collider.checkCollisions = true;
		collider.isPickable = true;

		collider.setParent(node);
		collider.position = offset.add(new Vector3(0, 0.5 * size.y, 0));
	}
}

export default ModelBlockManager;
