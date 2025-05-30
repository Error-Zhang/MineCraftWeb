import { ImportMeshAsync, Mesh, MeshBuilder, Scene, TransformNode, Vector3 } from "@babylonjs/core";

export class PlayerModel {
	constructor(private scene: Scene) {}

	// 加载玩家模型
	public async loadPlayerModel(modelPath: string) {
		const { meshes } = await ImportMeshAsync(modelPath, this.scene);
		const collider = this.createPlayerCollider();
		const playerModel = new TransformNode("player", this.scene);
		meshes.forEach(mesh => {
			mesh.isPickable = false;
			mesh.setParent(playerModel);
		});
		playerModel.setParent(collider);
		playerModel.position.y = -0.7; // 半高对齐
		return collider;
	}

	// 创建玩家碰撞体
	private createPlayerCollider(): Mesh {
		const collider = MeshBuilder.CreateBox(
			"playerCollider",
			{
				width: 0.4,
				depth: 0.2,
				height: 1.7,
			},
			this.scene
		);
		collider.position = new Vector3(1, 2, 1);
		collider.checkCollisions = true;
		collider.isVisible = false;
		collider.isPickable = false;
		return collider;
	}
}
